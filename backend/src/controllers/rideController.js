import Ride from '../models/Ride.js';
import { getDistanceMatrix, geocodeAddress } from '../services/mapsService.js';
import { calculateRideCost } from '../services/pricingService.js';
import User from '../models/User.js';

import AdminConfig from '../models/AdminConfig.js';

// Basic in-memory cache for AdminConfig to avoid repeated DB hits
let cachedConfig = null;
let lastCacheTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const getAdminConfig = async () => {
    const now = Date.now();
    if (cachedConfig && (now - lastCacheTime < CACHE_DURATION)) {
        return cachedConfig;
    }
    const config = await AdminConfig.findOne().sort({ createdAt: -1 }).lean() || { 
        petrolPrice: 100, 
        dieselPrice: 90, 
        riderMinFee: 15, 
        riderPercentage: 3, 
        driverMinFee: 10, 
        driverPercentage: 1 
    };
    cachedConfig = config;
    lastCacheTime = now;
    return config;
};

const calculateStars = (totalRides) => {
    if (totalRides >= 1000) return 5;
    if (totalRides >= 500) return 4;
    if (totalRides >= 200) return 3;
    if (totalRides >= 100) return 2;
    if (totalRides >= 50) return 1;
    return 0;
};

export const postRide = async (req, res, next) => {
    try {
        // Basic verification
        const user = await User.findById(req.user._id).select('vehicleDetails totalRidesGiven').lean();
        if (!user || !user.vehicleDetails || !user.vehicleDetails.hasVehicle) {
            return res.status(403).json({ message: 'Must add vehicle details to post a ride' });
        }

        let { origin, destination, startTime, totalSeats, manualDistance } = req.body;

        if (!origin?.coordinates || origin.coordinates.length < 2 || origin.coordinates[0] == null) {
            origin.coordinates = await geocodeAddress(origin.name);
        }

        if (!destination?.coordinates || destination.coordinates.length < 2 || destination.coordinates[0] == null) {
            destination.coordinates = await geocodeAddress(destination.name);
        }

        let distanceKm = manualDistance ? parseFloat(manualDistance) : 0;

        if (!manualDistance) {
            // Get distance using Google Maps Service
            const distanceData = await getDistanceMatrix(
                origin.coordinates,
                destination.coordinates
            );
            distanceKm = distanceData.distanceValue / 1000;
        }

        // Cost calculation calculation model as spec Model logic
        let totalFuelCost = 0;
        let fuelCostPerUser = 0;
        let driverFee = 0;
        let riderFee = 0;
        let costPerSeat = 0; // Rider Cost

        if (distanceKm > 0) {
            const config = await getAdminConfig();
            const mileageToUse = user.vehicleDetails.mileage || 15;
            const hasDiesel = user.vehicleDetails.fuelType === 'diesel';
            const priceToUse = hasDiesel ? config.dieselPrice : config.petrolPrice;

            totalFuelCost = (distanceKm / mileageToUse) * priceToUse;
            fuelCostPerUser = totalFuelCost / (totalSeats + 1);

            driverFee = Math.max(config.driverMinFee, fuelCostPerUser * ((config.driverPercentage || 5) / 100));
            riderFee = Math.max(config.riderMinFee, fuelCostPerUser * ((config.riderPercentage || 10) / 100));

            // final assignments
            costPerSeat = fuelCostPerUser + riderFee;
        }

        const newRide = await Ride.create({
            driver: req.user._id,
            origin: {
                name: origin.name,
                location: {
                    type: 'Point',
                    coordinates: origin.coordinates,
                },
            },
            destination: {
                name: destination.name,
                location: {
                    type: 'Point',
                    coordinates: destination.coordinates,
                },
            },
            startTime,
            distanceKm,
            totalSeats,
            availableSeats: totalSeats,
            vehicleType: user.vehicleDetails.vehicleType,
            fuelCost: totalFuelCost,
            driverFee,
            riderFee,
            driverPlatformFee: driverFee,
            riderPlatformFee: riderFee,
            totalCost: totalFuelCost + driverFee + (riderFee * totalSeats),
            costPerSeat,
        });

        // User update mechanics
        await User.findByIdAndUpdate(req.user._id, { $inc: { totalRidesGiven: 1 } });

        res.status(201).json(newRide);
    } catch (error) {
        next(error);
    }
};

export const searchRides = async (req, res, next) => {
    try {
        let { originLng, originLat, destLng, destLat, originName, destName, maxDistance = 5000, date } = req.query;

        if ((!originLng || !originLat) && originName) {
            const coords = await geocodeAddress(originName);
            originLng = coords[0];
            originLat = coords[1];
        }

        if ((!destLng || !destLat) && destName) {
            const coords = await geocodeAddress(destName);
            destLng = coords[0];
            destLat = coords[1];
        }

        if (!originLng || !originLat || (!destLng && !destLat && !destName)) {
            return res.status(400).json({ message: 'Origin and destination coordinates or names are required' });
        }

        // Geospatial Query using MongoDB 2dsphere index
        const startOfDay = new Date(date).setHours(0, 0, 0, 0);
        const endOfDay = new Date(date).setHours(23, 59, 59, 999);

        const rides = await Ride.find({
            status: 'PENDING',
            availableSeats: { $gt: 0 },
            'origin.location': {
                $near: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [parseFloat(originLng), parseFloat(originLat)],
                    },
                    $maxDistance: parseInt(maxDistance), // Max 5 km away from user intent
                },
            },
            startTime: {
                $gte: new Date(startOfDay),
                $lte: new Date(endOfDay),
            },
            driver: { $ne: req.user._id } // Don't show user's own rides
        })
        .select('origin destination startTime availableSeats vehicleType costPerSeat driver')
        .populate('driver', 'name rating vehicleDetails.model totalRidesGiven')
        .limit(30)
        .lean();

        const ridesWithStars = rides.map(r => ({
            ...r,
            driver: {
                ...r.driver,
                stars: calculateStars(r.driver.totalRidesGiven || 0)
            }
        }));

        res.status(200).json(ridesWithStars);
    } catch (error) {
        next(error);
    }
};

export const updateRideStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const ride = await Ride.findById(id);
        if (!ride) return res.status(404).json({ message: 'Ride not found' });

        if (ride.driver.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Only driver can update ride status' });
        }

        ride.status = status;
        await ride.save();

        // If completed, increment rides taken for all accepted passengers
        if (status === 'COMPLETED') {
            const RideRequest = (await import('../models/RideRequest.js')).default;
            const requests = await RideRequest.find({ ride: id, status: 'ACCEPTED' });
            
            for (const request of requests) {
                await User.findByIdAndUpdate(request.passenger, { $inc: { totalRidesTaken: 1 } });
            }
        }

        res.status(200).json(ride);
    } catch (error) {
        next(error);
    }
};

export const getRideDetails = async (req, res, next) => {
    try {
        const ride = await Ride.findById(req.params.id)
            .populate('driver', 'name phoneNumber rating totalRidesGiven vehicleDetails')
            .select('-__v')
            .lean();

        if (!ride) {
            return res.status(404).json({ message: 'Ride not found' });
        }

        ride.driver.stars = calculateStars(ride.driver.totalRidesGiven || 0);

        // Hide driver details unless user has paid or is the driver
        if (ride.driver._id.toString() !== req.user._id.toString()) {
            const RideRequest = (await import('../models/RideRequest.js')).default;
            const paidRequest = await RideRequest.findOne({
                ride: ride._id,
                passenger: req.user._id,
                status: 'ACCEPTED'
            }).lean();

            if (!paidRequest) {
                // Check if they just paid the fee but not yet accepted
                const paidFee = await RideRequest.findOne({
                    ride: ride._id,
                    passenger: req.user._id,
                    riderPaid: true
                }).lean();
                
                if (!paidFee) {
                    ride.driver.phoneNumber = 'HIDDEN (Pay to Unlock)';
                }
            }
        } else {
            // If user is driver, show accepted passengers details
            const RideRequest = (await import('../models/RideRequest.js')).default;
            const acceptedPassengers = await RideRequest.find({
                ride: ride._id,
                status: 'ACCEPTED'
            }).populate('passenger', 'name phoneNumber rating').lean();
            
            ride.passengers = acceptedPassengers;
        }

        res.status(200).json(ride);
    } catch (error) {
        next(error);
    }
};

export const cancelRide = async (req, res, next) => {
    try {
        const ride = await Ride.findById(req.params.id);
        if (!ride) return res.status(404).json({ message: 'Ride not found' });

        if (ride.driver.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Only driver can cancel the ride' });
        }

        if (ride.status === 'COMPLETED') {
            return res.status(400).json({ message: 'Cannot cancel a completed ride' });
        }

        ride.status = 'CANCELLED';
        await ride.save();

        // Also cancel all related requests
        const RideRequest = (await import('../models/RideRequest.js')).default;
        await RideRequest.updateMany({ ride: ride._id }, { status: 'CANCELLED' });

        res.status(200).json({ message: 'Ride cancelled successfully' });
    } catch (error) {
        next(error);
    }
};
