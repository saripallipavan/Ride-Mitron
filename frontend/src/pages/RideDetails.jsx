import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { rideAPI, bookingAPI, paymentAPI } from '../api/apiRoutes';
import { useAuth } from '../context/AuthContext';
import { Clock, Users, Info, CarFront, Calculator, Globe, Zap, ShieldCheck, ChevronRight, Navigation, MapPin, CreditCard, Phone } from 'lucide-react';
import Loader from '../components/Loader';

export default function RideDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [ride, setRide] = useState(null);
    const [loading, setLoading] = useState(true);
    const [bookingLoading, setBookingLoading] = useState(false);
    const [seats, setSeats] = useState(1);

    useEffect(() => {
        const fetchRide = async () => {
            try {
                const { data } = await rideAPI.getRideDetails(id);
                setRide(data);
            } catch (error) {
                console.error("Failed to fetch ride details");
                navigate('/search-ride');
            } finally {
                setLoading(false);
            }
        };
        fetchRide();
    }, [id, navigate]);

    const handleBook = async () => {
        setBookingLoading(true);
        try {
            const reqData = await bookingAPI.requestBooking({ rideId: ride._id, seatsRequested: seats });
            const rideRequest = reqData.data;

            const { data: orderData } = await paymentAPI.createOrder({ requestId: rideRequest._id });

            const options = {
                key: orderData.keyId,
                amount: orderData.order.amount,
                currency: "INR",
                name: "Ride Mitron",
                description: "Platform Fee to Unlock Ride Details",
                order_id: orderData.order.id,
                handler: async function (response) {
                    try {
                        await paymentAPI.verifyPayment({
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_signature: response.razorpay_signature,
                            requestId: rideRequest._id,
                            paymentType: 'RIDER_FEE'
                        });
                        alert("Payment successful! Request submitted.");
                        navigate('/dashboard');
                    } catch (err) {
                        alert("Payment verification failed.");
                        setBookingLoading(false);
                    }
                },
                prefill: {
                    name: user?.name,
                    contact: user?.phoneNumber
                },
                theme: {
                    color: "#4f46e5"
                }
            };

            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', function (response) {
                alert(response.error.description);
                setBookingLoading(false);
            });
            rzp.open();

        } catch (error) {
            console.error("Booking Error:", error.response?.data);
            alert(error.response?.data?.message || 'Failed to initiate sync request. Please try again.');
            setBookingLoading(false);
        }
    };

    if (loading) return <Loader />;
    if (!ride) return (
        <div className="flex justify-center items-center h-screen">
            <p className="text-xl font-black text-slate-500 uppercase tracking-widest">Signal Not Found</p>
        </div>
    );

    const isDriver = user?._id === ride.driver?._id;

    const totalCapacity = ride.totalSeats + 1;
    const singleFuelShare = ride.fuelCost / totalCapacity;

    const rideDate = new Date(ride.startTime);
    const dateFormatted = rideDate.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
    const timeFormatted = rideDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return (
        <div className="w-full relative min-h-screen pb-40">
            {/* Background Decor */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
                <div className="absolute top-0 right-0 w-[60rem] h-[60rem] bg-indigo-600/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-[50rem] h-[50rem] bg-primary-600/5 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2"></div>
            </div>

            {/* Hero Section */}
            <div className="w-full bg-[#020617] relative overflow-hidden pt-32 pb-48 px-6 sm:px-12 rounded-b-[4rem] sm:rounded-b-[6rem]">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 mix-blend-overlay"></div>
                <div className="absolute top-0 left-1/4 w-[40rem] h-[40rem] bg-primary-600/10 rounded-full blur-[150px] mix-blend-screen pointer-events-none animate-pulse"></div>
                
                <div className="max-w-7xl mx-auto relative z-10">
                    <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-12">
                        <div className="space-y-6 max-w-4xl">
                            <div className="inline-flex items-center gap-2 bg-white/5 backdrop-blur-3xl border border-white/10 px-4 py-1.5 rounded-full text-primary-300 font-black uppercase tracking-[0.3em] text-[9px] shadow-2xl">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                ACTIVE TRAJECTORY SIGNAL
                            </div>
                            
                            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-[-0.05em] text-white leading-[1.1] uppercase">
                                {ride.origin.name.split(',')[0]} 
                                <span className="text-primary-500 mx-4 opacity-50 italic">/</span> 
                                {ride.destination.name.split(',')[0]}
                            </h1>

                            <div className="flex flex-wrap items-center gap-8 text-slate-400">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 shadow-lg">
                                        <Clock className="w-4 h-4 text-indigo-400" />
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-0.5">Departure</p>
                                        <p className="text-white font-bold text-sm">{dateFormatted} · {timeFormatted}</p>
                                    </div>
                                </div>
                                <div className="h-10 w-px bg-white/10 hidden md:block"></div>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 shadow-lg">
                                        <CarFront className="w-4 h-4 text-emerald-400" />
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-0.5">Vehicle</p>
                                        <p className="text-white font-bold text-sm uppercase">{ride.driver.vehicleDetails?.model || ride.vehicleType}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="relative group">
                            <div className="absolute inset-0 bg-primary-600 rounded-[3rem] blur-3xl opacity-20 group-hover:opacity-30 transition-opacity"></div>
                            <div className="relative bg-white/5 backdrop-blur-3xl border border-white/10 p-10 rounded-[3rem] flex flex-col items-center justify-center shadow-3xl min-w-[240px]">
                                <span className="text-[9px] font-black uppercase tracking-[0.3em] text-primary-400 mb-2">Sync Access Fee</span>
                                <div className="flex items-start">
                                    <span className="text-2xl font-black text-primary-500 mt-2 mr-1">₹</span>
                                    <span className="text-7xl font-black text-white tracking-tighter leading-none">{ride.costPerSeat.toFixed(0)}</span>
                                </div>
                                <span className="mt-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">per peer unit</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="max-w-7xl mx-auto px-6 -mt-20 relative z-20">
                <div className="grid lg:grid-cols-12 gap-10 items-start">
                    
                    {/* Left Column: Details & Telemetry */}
                    <div className="lg:col-span-8 space-y-10">
                        {/* Driver Card */}
                        <div className="glass-panel group !p-1 underline-none hover:shadow-primary-600/5 transition-all">
                            <div className="bg-white/80 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/60 shadow-sm flex flex-col md:flex-row items-center gap-10">
                                <div className="relative shrink-0">
                                    <div className="w-24 h-24 rounded-[2rem] bg-slate-900 flex items-center justify-center text-white text-4xl font-black shadow-2xl relative z-10 group-hover:scale-105 transition-transform">
                                        {ride.driver.name.charAt(0)}
                                    </div>
                                    <div className="absolute -bottom-1 -right-1 w-9 h-9 bg-emerald-500 border-4 border-white rounded-full z-20 flex items-center justify-center shadow-lg">
                                        <ShieldCheck className="w-4 h-4 text-white" />
                                    </div>
                                </div>
                                
                                <div className="flex-1 text-center md:text-left">
                                    <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
                                        <h2 className="text-3xl font-black text-slate-900 tracking-tight">{ride.driver.name}</h2>
                                        <div className="flex items-center justify-center gap-2 bg-amber-50 text-amber-700 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-amber-100 italic">
                                            {ride.driver.rating?.toFixed(1) || '5.0'} Trust <Zap className="w-3 h-3 fill-amber-500" />
                                        </div>
                                        {ride.driver.stars > 0 && (
                                            <div className="flex items-center gap-1 bg-indigo-50 text-indigo-700 px-4 py-1 rounded-full text-[10px] font-black">
                                                {[...Array(ride.driver.stars)].map((_, i) => (
                                                    <Zap key={i} className="w-3 h-3 fill-indigo-500" />
                                                ))}
                                                <span className="ml-1 uppercase tracking-widest">{ride.driver.totalRidesGiven >= 1000 ? 'LEGEND' : 'ELITE'} VETERAN</span>
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-slate-500 font-bold mb-6 text-sm">Seasoned operator on the Mitron Grid with {ride.driver.totalRidesGiven || 0} successful syncs.</p>
                                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                                        <div className="bg-slate-100 text-slate-900 px-5 py-2 rounded-2xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2">
                                            <CarFront className="w-3.5 h-3.5" /> {ride.driver.vehicleDetails?.model || ride.vehicleType} CLASS ASSET
                                        </div>
                                        <div className="bg-indigo-50 text-indigo-600 px-5 py-2 rounded-2xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 border border-indigo-100">
                                            <Users className="w-3.5 h-3.5" /> {ride.totalSeats} CAPACITY
                                        </div>
                                        <div className={`px-5 py-2 rounded-2xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 border ${(ride.driver.phoneNumber || '').includes('HIDDEN') ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                                            <Phone className="w-3.5 h-3.5" /> {ride.driver.phoneNumber}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Route Telemetry */}
                        <div className="glass-panel !p-10 !rounded-[3rem] space-y-12">
                            <div className="flex items-center gap-3">
                                <div className="w-1.5 h-1.5 rounded-full bg-primary-600 animate-ping"></div>
                                <h3 className="text-xs font-black uppercase tracking-[0.4em] text-slate-500">Node Connectivity Path</h3>
                            </div>

                            <div className="relative flex flex-col gap-16 pl-4 md:pl-10">
                                {/* Vertical Line */}
                                <div className="absolute left-[2.25rem] md:left-[3.75rem] top-8 bottom-8 w-px bg-slate-200">
                                    <div className="w-full h-1/2 bg-gradient-to-b from-primary-500 to-transparent animate-pulse"></div>
                                </div>

                                <div className="flex items-start gap-8 relative">
                                    <div className="w-10 h-10 md:w-14 md:h-14 rounded-2xl bg-white border border-slate-200 shadow-xl flex items-center justify-center z-10 shrink-0">
                                        <MapPin className="w-5 h-5 md:w-6 md:h-6 text-slate-400" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Origin Signal</p>
                                        <p className="text-xl md:text-2xl font-black text-slate-900 tracking-tight leading-none uppercase">{ride.origin.name}</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-8 relative">
                                    <div className="w-10 h-10 md:w-14 md:h-14 rounded-2xl bg-primary-600 shadow-2xl shadow-primary-600/40 flex items-center justify-center z-10 shrink-0 border-4 border-white">
                                        <Navigation className="w-5 h-5 md:w-6 md:h-6 text-white transform rotate-45" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-primary-500 uppercase tracking-widest mb-1.5">Convergence Point</p>
                                        <p className="text-xl md:text-2xl font-black text-slate-900 tracking-tight leading-none uppercase">{ride.destination.name}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Economics & Booking */}
                    <div className="lg:col-span-4 space-y-10">
                        
                        {/* Economics Card */}
                        <div className="glass-panel !bg-white p-8 rounded-[3rem] shadow-xl border border-white/20">
                            <div className="flex items-center gap-4 mb-10 pb-6 border-b border-slate-50">
                                <div className="bg-indigo-50 p-3 rounded-2xl text-indigo-600 shadow-sm"><Calculator className="w-5 h-5" /></div>
                                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-900">Platform Economics</h3>
                            </div>

                            <div className="space-y-6">
                                <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest text-slate-400">
                                    <span>Base Energy Split</span>
                                    <span className="text-slate-900 font-black">₹{singleFuelShare.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest text-slate-400">
                                    <span>Network Fee</span>
                                    <span className="text-slate-900 font-black">₹{ride.riderFee?.toFixed(2) || '0.00'}</span>
                                </div>
                                <div className="pt-6 border-t border-slate-50 flex justify-between items-end">
                                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 leading-none mb-1">Total Unit Cost</p>
                                    <p className="text-4xl font-black text-slate-900 leading-none tracking-tighter">₹{ride.costPerSeat.toFixed(0)}</p>
                                </div>
                            </div>

                            <div className="mt-10 bg-slate-50 p-6 rounded-3xl space-y-4">
                                <div className="flex gap-4">
                                    <Info className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                                    <div className="space-y-2">
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900">Sync Workflow</p>
                                        <ol className="text-[9px] font-bold text-slate-500 uppercase tracking-widest list-decimal pl-4 space-y-2">
                                            <li>Rider pays 3% platform fee to request sync.</li>
                                            <li>Driver pays 1% platform fee to accept request.</li>
                                            <li>Once both pay, contact details unlock & seats are reserved.</li>
                                        </ol>
                                    </div>
                                </div>
                                <div className="pt-4 border-t border-slate-200">
                                    <p className="text-[8px] font-bold text-slate-400 leading-relaxed uppercase tracking-widest">
                                        Zero-profit protocol activated. Energy costs are split purely among nodes to optimize regional mobility. No surge mechanisms present.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Booking Card */}
                        <div className="bg-[#020617] rounded-[3rem] p-10 shadow-3xl relative overflow-hidden group">
                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 mix-blend-overlay"></div>
                            
                            <div className="relative z-10 space-y-10">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500">Unit Allocation</h3>
                                    <div className="bg-white/5 border border-white/10 px-4 py-1.5 rounded-full text-[9px] font-black text-emerald-400 uppercase tracking-widest">
                                        {ride.availableSeats} Units Open
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <label className="block text-[8px] font-black uppercase tracking-[0.4em] text-slate-500 ml-1">Reserve peer capacity:</label>
                                    <div className="relative group/select">
                                        <select
                                            value={seats}
                                            onChange={(e) => setSeats(Number(e.target.value))}
                                            className="w-full bg-white/5 border border-white/10 text-white font-black text-xl p-6 rounded-[2rem] appearance-none cursor-pointer focus:ring-4 focus:ring-primary-500/20 focus:outline-none transition-all hover:bg-white/10"
                                        >
                                            {[...Array(ride.availableSeats)].map((_, i) => (
                                                <option className="text-slate-900" key={i} value={i + 1}>{i + 1} PEER UNIT{(i + 1) > 1 ? 'S' : ''}</option>
                                            ))}
                                        </select>
                                        <Users className="absolute right-8 top-1/2 -translate-y-1/2 w-6 h-6 text-primary-500 pointer-events-none group-hover/select:scale-110 transition-transform" />
                                    </div>
                                </div>

                                <div className="pt-6">
                                    {isDriver ? (
                                        <div className="w-full bg-slate-800/50 border border-white/5 rounded-[2rem] py-8 text-center">
                                            <p className="text-xs font-black uppercase tracking-widest text-slate-500 mb-1">Host Protocol Active</p>
                                            <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">You are the operator of this journey</p>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={handleBook}
                                            disabled={bookingLoading || ride.availableSeats === 0}
                                            className="group relative w-full bg-primary-600 hover:bg-primary-500 disabled:bg-slate-800 text-white rounded-[2rem] py-8 transition-all active:scale-95 shadow-2xl shadow-primary-600/30 overflow-hidden"
                                        >
                                            {bookingLoading ? (
                                                <Zap className="h-6 w-6 animate-spin mx-auto" />
                                            ) : (
                                                <div className="relative z-10 flex flex-col items-center">
                                                    <div className="flex items-center gap-3 font-black uppercase tracking-[0.2em] text-[11px] mb-1">
                                                        UNLOCK CONTACT DETAILS <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                                    </div>
                                                    <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest flex items-center gap-1.5">
                                                        <CreditCard className="w-3 h-3" /> Settlement: ₹{(seats * ride.costPerSeat).toFixed(0)}
                                                    </span>
                                                </div>
                                            )}
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer pointer-events-none"></div>
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Security Protocol */}
                        <div className="text-center px-4 space-y-4 opacity-50 hover:opacity-100 transition-opacity">
                            <div className="flex items-center justify-center gap-2 mb-2">
                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                                <span className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-500">Secure Protocol Activated</span>
                            </div>
                            <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest leading-loose max-w-xs mx-auto">
                                All node sync requests undergo end-to-end encryption. Operator identities are verified via system-wide reputation audits.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
