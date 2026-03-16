import { useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Home, Search, Navigation, LogOut, User, Activity, Zap, Menu, X } from 'lucide-react';

const Navbar = () => {
    const { user, logout } = useAuth();
    const location = useLocation();
    const [isVisible, setIsVisible] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const handleScroll = useCallback(() => {
        const currentScrollY = window.scrollY;
        
        if (currentScrollY < 50) {
            setIsVisible(true);
        } else {
            setIsVisible(currentScrollY < lastScrollY);
        }
        
        setLastScrollY(currentScrollY);
        if (currentScrollY > lastScrollY) setIsMobileMenuOpen(false);
    }, [lastScrollY]);

    useEffect(() => {
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [handleScroll]);

    const navLinkClass = (path) => `
        flex items-center gap-3 px-4 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-500
        ${location.pathname === path 
            ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/20' 
            : 'text-slate-400 hover:text-white hover:bg-white/5'}
    `;

    return (
        <header className={`fixed top-4 sm:top-6 left-1/2 -translate-x-1/2 z-[100] w-[92%] sm:w-[95%] max-w-7xl transition-all duration-700 ease-in-out ${isVisible ? 'translate-y-0 opacity-100' : '-translate-y-32 opacity-0 pointer-events-none'}`}>
            <nav className="bg-slate-900/80 backdrop-blur-3xl border border-white/5 rounded-2xl sm:rounded-[2.5rem] p-2 sm:p-3 px-4 sm:px-6 shadow-2xl flex items-center justify-between relative overflow-hidden">
                {/* Background Glow */}
                <div className="absolute -left-10 -top-10 w-32 h-32 bg-primary-500/10 blur-[50px] rounded-full"></div>

                {/* Logo Section */}
                <Link to="/dashboard" className="flex items-center gap-3 sm:gap-4 group relative z-10 no-underline">
                    <img 
                        src="/logo.png" 
                        alt="Ride Mitron Logo" 
                        className="w-9 h-9 sm:w-11 sm:h-11 object-contain group-hover:scale-110 transition-transform flex-shrink-0 drop-shadow-lg" 
                    />
                    <span className="text-lg sm:text-xl font-black text-white tracking-tighter uppercase whitespace-nowrap">
                        Ride <span className="text-primary-400">Mitron</span>
                    </span>
                </Link>

                {/* Desktop Navigation */}
                <div className="hidden md:flex items-center gap-1 sm:gap-3 relative z-10">
                    <Link to="/dashboard" className={navLinkClass('/dashboard')}>
                        <Home className="w-3.5 h-3.5" /> <span className="hidden lg:inline">Home</span>
                    </Link>
                    <Link to="/search-ride" className={navLinkClass('/search-ride')}>
                        <Search className="w-3.5 h-3.5" /> <span className="hidden lg:inline">Search</span>
                    </Link>
                    <Link to="/post-ride" className={navLinkClass('/post-ride')}>
                        <Navigation className="w-3.5 h-3.5" /> <span className="hidden lg:inline">Post</span>
                    </Link>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-2 sm:gap-4 relative z-10">
                    {user && (
                        <div className="hidden sm:flex items-center gap-3 px-4 py-1.5 bg-white/5 border border-white/5 rounded-full">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                            <span className="text-[9px] font-black text-white uppercase tracking-widest truncate max-w-[80px] lg:max-w-none">{user.name}</span>
                        </div>
                    )}
                    
                    <button 
                        onClick={logout}
                        className="hidden sm:flex p-2 sm:p-3 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 rounded-lg sm:rounded-xl transition-all duration-500"
                    >
                        <LogOut className="w-4 h-4 sm:w-5 h-5" />
                    </button>

                    {/* Mobile Menu Trigger */}
                    <button 
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="p-2 sm:p-3 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-lg sm:rounded-xl md:hidden transition-all"
                    >
                        {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                </div>

                {/* Mobile Menu Overlay */}
                <div className={`absolute top-full left-0 w-full bg-slate-900/95 backdrop-blur-2xl border-t border-white/5 transition-all duration-500 ease-in-out md:hidden flex flex-col p-6 gap-3 ${isMobileMenuOpen ? 'max-h-[400px] opacity-100 py-10' : 'max-h-0 opacity-0 py-0 pointer-events-none'}`}>
                    <Link to="/dashboard" onClick={() => setIsMobileMenuOpen(false)} className={navLinkClass('/dashboard')}>
                        <Home className="w-4 h-4" /> Home Page
                    </Link>
                    <Link to="/search-ride" onClick={() => setIsMobileMenuOpen(false)} className={navLinkClass('/search-ride')}>
                        <Search className="w-4 h-4" /> Discover Rides
                    </Link>
                    <Link to="/post-ride" onClick={() => setIsMobileMenuOpen(false)} className={navLinkClass('/post-ride')}>
                        <Navigation className="w-4 h-4" /> Post Journey
                    </Link>
                    <div className="h-px bg-white/5 my-2"></div>
                    <button 
                        onClick={() => { logout(); setIsMobileMenuOpen(false); }}
                        className="flex items-center gap-3 px-4 py-3 text-red-400 font-black text-[11px] uppercase tracking-[0.2em] bg-red-500/5 rounded-xl border border-red-500/10"
                    >
                        <LogOut className="w-4 h-4" /> Terminate Session
                    </button>
                </div>
            </nav>
        </header>
    );
};

export default Navbar;
