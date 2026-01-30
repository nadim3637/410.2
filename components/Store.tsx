import React, { useState, useEffect } from 'react';
import { User, CreditPackage, SystemSettings } from '../types';
import { Crown, Sparkles, Check, X, Zap, MessageSquare, Lock } from 'lucide-react';

interface Props {
  user: User;
  settings?: SystemSettings;
  onUserUpdate: (user: User) => void;
}

const DEFAULT_PACKAGES: CreditPackage[] = [
  { id: 'pkg-1', name: '100 Credits', credits: 100, price: 10 },
  { id: 'pkg-2', name: '200 Credits', credits: 200, price: 20 },
  { id: 'pkg-3', name: '500 Credits', credits: 500, price: 50 },
  { id: 'pkg-4', name: '1000 Credits', credits: 1000, price: 100 },
  { id: 'pkg-5', name: '2000 Credits', credits: 2000, price: 200 },
  { id: 'pkg-6', name: '5000 Credits', credits: 5000, price: 500 },
  { id: 'pkg-7', name: '10000 Credits', credits: 10000, price: 1000 }
];

export const Store: React.FC<Props> = ({ user, settings }) => {
  // "BASIC" maps to "PRO", "ULTRA" maps to "MAX"
  const [tierType, setTierType] = useState<'BASIC' | 'ULTRA'>('BASIC'); 
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  
  const packages = settings?.packages || DEFAULT_PACKAGES;
  const subscriptionPlans = settings?.subscriptionPlans || [];
  
  // Set default selected plan
  useEffect(() => {
    if (subscriptionPlans.length > 0 && !selectedPlanId) {
      // Try to find "Monthly" or first
      const defaultPlan = subscriptionPlans.find(p => p.name.includes('Monthly')) || subscriptionPlans[0];
      setSelectedPlanId(defaultPlan.id);
    }
  }, [subscriptionPlans]);

  const selectedPlan = subscriptionPlans.find(p => p.id === selectedPlanId);

  // NEW: Support Modal State
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [purchaseItem, setPurchaseItem] = useState<any>(null); // Plan or CreditPackage

  // Special Discount Event Logic
  const event = settings?.specialDiscountEvent;
  const isSubscribed = user.isPremium && user.subscriptionEndDate && new Date(user.subscriptionEndDate) > new Date();
  
  // NEW: Check if event is actually active (now >= startsAt && now < endsAt)
  const isEventActive = () => {
    if (!event?.enabled || !event?.startsAt || !event?.endsAt) return false;
    const now = Date.now();
    const startsAt = new Date(event.startsAt).getTime();
    const endsAt = new Date(event.endsAt).getTime();
    return now >= startsAt && now < endsAt;
  };

  const activeEvent = isEventActive();
  const showEventBanner = event?.enabled && ((isSubscribed && event.showToPremiumUsers) || (!isSubscribed && event.showToFreeUsers));

  // Countdown Timer Logic
  const [timeLeft, setTimeLeft] = useState<{days: number, hours: number, minutes: number, seconds: number} | null>(null);

  useEffect(() => {
    if (!event?.enabled || (!event?.startsAt && !event?.endsAt)) {
        setTimeLeft(null);
        return;
    }

    const calculateTime = () => {
        const now = new Date().getTime();
        const start = event.startsAt ? new Date(event.startsAt).getTime() : 0;
        const end = event.endsAt ? new Date(event.endsAt).getTime() : 0;
        
        let diff = 0;
        if (now < start) {
            // Cooldown Phase
            diff = start - now;
        } else if (now < end) {
            // Active Phase
            diff = end - now;
        }

        if (diff <= 0) {
            setTimeLeft(null);
        } else {
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);
            setTimeLeft({ days, hours, minutes, seconds });
        }
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [event]);

  const handleSupportClick = (numEntry: any) => {
      if (!purchaseItem) return;
      
      const isSub = purchaseItem.duration !== undefined; // Detect if Sub Plan
      const itemName = purchaseItem.name;
      const price = isSub 
          ? (tierType === 'BASIC' ? purchaseItem.basicPrice : purchaseItem.ultraPrice)
          : purchaseItem.price;
      
      const features = isSub 
          ? (tierType === 'BASIC' ? 'MCQ + Notes (Pro)' : 'PDF + Videos + AI Studio (Max)')
          : `${purchaseItem.credits} Credits`;

      // Record Activity
      if (typeof (window as any).recordActivity === 'function') {
          (window as any).recordActivity('PURCHASE', `Initiated Purchase: ${itemName}`, price, { 
              itemId: purchaseItem.id,
              subject: isSub ? 'Subscription' : 'Credits'
          });
      }

      const message = `Hello Admin, I want to buy:\n\nItem: ${itemName} ${isSub ? `(${tierType === 'BASIC' ? 'PRO' : 'MAX'})` : ''}\nPrice: ₹${price}\nUser ID: ${user.id}\nDetails: ${features}\n\nPlease share payment details.`;
      
      window.open(`https://wa.me/91${numEntry.number}?text=${encodeURIComponent(message)}`, '_blank');
      setShowSupportModal(false);
  };

  const initiatePurchase = (item: any) => {
      setPurchaseItem(item);
      setShowSupportModal(true);
  };

  if (settings?.isPaymentEnabled === false) {
    return (
      <div className="animate-in fade-in zoom-in duration-300 pb-10">
        <div className="bg-slate-900 p-10 rounded-3xl border border-slate-800 text-center shadow-2xl">
          <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner border border-slate-700">
            <Lock size={40} className="text-slate-500" />
          </div>
          <h3 className="text-2xl font-black text-slate-200 mb-2">Store Locked</h3>
          <p className="text-slate-500 font-medium max-w-xs mx-auto leading-relaxed">
            {settings.paymentDisabledMessage || "Purchases are currently disabled by the Admin. Please check back later."}
          </p>
        </div>
      </div>
    );
  }

  // Derived Data
  const featuresList = tierType === 'BASIC' 
    ? [
        'Daily Login Bonus: 10 Credits/Day',
        'Full MCQs Unlocked',
        'Premium Notes (Standard)',
        'Audio Library (Standard)',
        'AI Videos (2D Basic)',
        'Team Support',
        'Spin Wheel (5 Spins/Day)'
      ] 
    : [
        'Daily Login Bonus: 20 Credits/Day',
        'Everything in Basic Unlocked',
        'Premium Notes (Deep Dive)',
        'Ultra Podcast (Studio HD)',
        'AI Videos (2D + 3D Deep Dive)',
        'Competitive Mode Unlocked 🏆',
        'Spin Wheel (10 Spins/Day)'
      ];

  const currentPrice = selectedPlan 
    ? (tierType === 'BASIC' ? selectedPlan.basicPrice : selectedPlan.ultraPrice)
    : 0;

  const originalPrice = selectedPlan
    ? (tierType === 'BASIC' ? selectedPlan.basicOriginalPrice : selectedPlan.ultraOriginalPrice)
    : 0;

  // Calculate monthly price equivalent if duration is yearly
  const getPerMonthPrice = (plan: any, price: number) => {
      if (plan.duration.toLowerCase().includes('year') || plan.duration.includes('365')) {
          return Math.round(price / 12);
      }
      return null;
  };
  
  const saveAmount = originalPrice - currentPrice;

  // Calculate days remaining for subscription
  const getDaysRemaining = () => {
    if (!user.subscriptionEndDate) return null;
    const end = new Date(user.subscriptionEndDate);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    if (diffTime <= 0) return null;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const daysRemaining = getDaysRemaining();

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 pb-24 relative min-h-screen bg-black text-white font-sans">
      
      {/* SUBSCRIPTION STATUS */}
      {user.isPremium && (
          <div className="max-w-md mx-auto pt-6 px-4">
              <div className="bg-gradient-to-r from-indigo-900 to-purple-900 p-4 rounded-2xl border border-white/10 shadow-xl flex items-center justify-between">
                  <div>
                      <p className="text-xs text-indigo-300 font-bold uppercase tracking-wider">Active Subscription</p>
                      <h4 className="text-white font-black">{user.subscriptionLevel === 'ULTRA' ? 'ULTRA MAX' : 'BASIC PRO'}</h4>
                  </div>
                  <div className="text-right">
                      <p className="text-[10px] text-indigo-300 font-medium">Remaining Time</p>
                      <p className="text-lg font-black text-yellow-400">{daysRemaining || 0} Days</p>
                  </div>
              </div>
          </div>
      )}

      {/* SUPPORT CHANNEL SELECTOR MODAL */}
      {showSupportModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
              <div className="bg-slate-900 rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden border border-slate-800">
                  <div className="bg-gradient-to-r from-cyan-600 to-blue-600 p-4 text-white text-center">
                      <h3 className="font-black text-lg flex items-center justify-center gap-2">
                          <MessageSquare size={20} /> Select Support Channel
                      </h3>
                      <p className="text-xs text-cyan-100 mt-1">Choose a number to proceed with payment</p>
                  </div>
                  <div className="p-4 space-y-3">
                      {(settings?.paymentNumbers || [{id: 'def', name: 'Main Support', number: '8227070298', dailyClicks: 0}]).map((num) => {
                          const totalClicks = settings?.paymentNumbers?.reduce((acc, curr) => acc + (curr.dailyClicks || 0), 0) || 1;
                          const traffic = Math.round(((num.dailyClicks || 0) / totalClicks) * 100);
                          const isGreen = traffic < 30;

                          return (
                              <button 
                                  key={num.id}
                                  onClick={() => handleSupportClick(num)}
                                  className="w-full bg-slate-800 p-3 rounded-xl border border-slate-700 flex justify-between items-center hover:bg-slate-700 hover:border-cyan-500/50 transition-all group"
                              >
                                  <div className="flex items-center gap-3">
                                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${isGreen ? 'bg-green-600' : 'bg-orange-500'}`}>
                                          {num.name.charAt(0)}
                                      </div>
                                      <div className="text-left">
                                          <p className="font-bold text-slate-200 text-sm group-hover:text-cyan-400">{num.name}</p>
                                          <p className="text-[10px] text-slate-500">{isGreen ? '✅ Fast Response' : '⚠️ High Traffic'}</p>
                                      </div>
                                  </div>
                                  <div className="text-right">
                                      <span className={`text-xs font-black ${isGreen ? 'text-green-500' : 'text-orange-500'}`}>{traffic}% Busy</span>
                                  </div>
                              </button>
                          );
                      })}
                  </div>
                  <div className="p-4 bg-slate-800 border-t border-slate-700 text-center">
                      <button onClick={() => setShowSupportModal(false)} className="text-slate-400 font-bold text-sm hover:text-white">Cancel</button>
                  </div>
              </div>
          </div>
      )}

      {/* --- PERPLEXITY STYLE STORE --- */}
      <div className="max-w-md mx-auto pt-8 px-4">
          
          {/* HEADER ICON */}
          <div className="flex justify-center mb-4">
              <Sparkles size={40} className="text-slate-400 opacity-80" strokeWidth={1.5} />
          </div>

          {/* TITLE & SUBTITLE */}
          <div className="text-center mb-8">
              <h2 className="text-4xl font-serif text-white tracking-tight mb-2">Select your plan</h2>
              <p className="text-slate-400 text-sm font-medium">Unlock your full potential today</p>
              
              {showEventBanner && timeLeft && (
                  <div className={`mt-4 bg-gradient-to-r border p-4 rounded-xl relative overflow-hidden ${activeEvent ? 'from-amber-900/40 to-orange-900/40 border-amber-500/30' : 'from-slate-900/40 to-slate-800/40 border-slate-500/30'}`}>
                      <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r animate-[shimmer_2s_infinite] ${activeEvent ? 'from-amber-500 to-orange-500' : 'from-slate-500 to-slate-400'}`}></div>
                      
                      <div className="flex justify-between items-center mb-2">
                          <div>
                              <p className={`font-black text-lg uppercase tracking-wider flex items-center gap-2 ${activeEvent ? 'text-amber-400' : 'text-slate-400'}`}>
                                  {activeEvent ? '🔥' : '⏳'} {event?.eventName} {activeEvent ? '' : '(Starts Soon)'}
                              </p>
                              <p className={`${activeEvent ? 'text-amber-200' : 'text-slate-300'} text-xs font-bold`}>
                                  {activeEvent ? `Limited Time Offer: ${isSubscribed ? (event?.renewalDiscountPercent || event?.discountPercent) : event?.discountPercent}% OFF` : `Stay Tuned! Big Discount Coming.`}
                              </p>
                          </div>
                          <div className="text-right">
                              <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${activeEvent ? 'text-amber-500' : 'text-slate-500'}`}>{activeEvent ? 'Ends In' : 'Starts In'}</p>
                              <div className="flex gap-2 font-mono text-white font-bold text-lg">
                                  {timeLeft.days > 0 && <span>{timeLeft.days}d</span>}
                                  <span>{String(timeLeft.hours).padStart(2, '0')}:</span>
                                  <span>{String(timeLeft.minutes).padStart(2, '0')}:</span>
                                  <span>{String(timeLeft.seconds).padStart(2, '0')}</span>
                              </div>
                          </div>
                      </div>
                  </div>
              )}
          </div>

          {/* TOGGLE: PRO vs MAX */}
          <div className="flex justify-center mb-8">
              <div className="bg-slate-900/50 p-1 rounded-full border border-slate-800 flex relative w-64 h-12">
                  <button 
                      onClick={() => setTierType('BASIC')}
                      className={`flex-1 rounded-full text-sm font-bold transition-all z-10 font-serif tracking-wide ${
                          tierType === 'BASIC' 
                          ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/20' 
                          : 'text-slate-400 hover:text-white'
                      }`}
                  >
                      Basic
                  </button>
                  <button 
                      onClick={() => setTierType('ULTRA')}
                      className={`flex-1 rounded-full text-sm font-bold transition-all z-10 font-serif tracking-wide flex items-center justify-center gap-2 ${
                          tierType === 'ULTRA' 
                          ? 'bg-white text-black shadow-lg' 
                          : 'text-slate-400 hover:text-white'
                      }`}
                  >
                      Ultra
                  </button>
              </div>
          </div>

          {/* FEATURES LIST */}
          <div className="mb-10 pl-2">
             <ul className="space-y-4">
                 {featuresList.map((feat, i) => (
                     <li key={i} className="flex items-start gap-3 text-sm text-slate-300 font-medium">
                         <Check size={18} className="text-slate-500 shrink-0 mt-0.5" strokeWidth={3} />
                         <span className="leading-snug">{feat}</span>
                     </li>
                 ))}
                 <li className="flex items-start gap-3 text-sm text-slate-300 font-medium">
                      <Check size={18} className="text-slate-500 shrink-0 mt-0.5" strokeWidth={3} />
                      <span className="leading-snug">
                          Get the best learning experience with our premium plans.
                      </span>
                 </li>
             </ul>
          </div>

          {/* PRICING CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {subscriptionPlans.map(plan => {
                  const isSelected = selectedPlanId === plan.id;
                  const original = tierType === 'BASIC' ? plan.basicOriginalPrice : plan.ultraOriginalPrice;
                  let price = tierType === 'BASIC' ? plan.basicPrice : plan.ultraPrice;

                  // Apply Event Discount ONLY if event is active
                  if (activeEvent) {
                      const eventDiscount = (isSubscribed ? (event?.renewalDiscountPercent || event?.discountPercent) : event?.discountPercent) || 0;
                      if ((isSubscribed && event?.showToPremiumUsers) || (!isSubscribed && event?.showToFreeUsers)) {
                          price = Math.round(price * (1 - eventDiscount / 100));
                      }
                  } else if (settings?.specialDiscountEvent?.discountPercent && !event?.enabled) {
                      // Unified fallback if general discount exists but specific event enabled flag is handled differently
                      const genDiscount = settings.specialDiscountEvent.discountPercent;
                      price = Math.round(price * (1 - genDiscount / 100));
                  }

                  const isYearly = plan.name.includes('Yearly');
                  const discountPercent = original > price ? Math.round(((original - price) / original) * 100) : 0;

                  return (
                      <button
                          key={plan.id}
                          onClick={() => setSelectedPlanId(plan.id)}
                          className={`p-5 rounded-2xl border text-left transition-all relative group flex flex-col justify-between h-32 ${
                              isSelected 
                                ? 'bg-[#18181b] border-cyan-500 shadow-[0_0_0_1px_rgba(6,182,212,1)]' 
                                : 'bg-[#0f0f11] border-slate-800 hover:border-slate-700'
                          }`}
                      >
                          {isSelected && (
                              <div className="absolute -top-2 -right-2 bg-cyan-500 text-black rounded-full p-1 shadow-lg">
                                  <Check size={12} strokeWidth={4} />
                              </div>
                          )}
                          
                          {/* Top Part */}
                          <div className="w-full flex justify-between items-start">
                              <span className={`font-bold text-sm ${isSelected ? 'text-cyan-400' : 'text-slate-200'}`}>
                                  {plan.name}
                              </span>
                              {discountPercent > 0 && (
                                  <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-bold">
                                      {discountPercent}% OFF
                                  </span>
                              )}
                          </div>

                          {/* Bottom Part */}
                          <div>
                              <div className="flex flex-col">
                                  <span className="text-[10px] text-slate-500 line-through mb-0.5">₹{original.toLocaleString('en-IN')}</span>
                                  <span className="text-xl font-serif text-white">₹{price.toLocaleString('en-IN')}.00</span>
                              </div>
                          </div>
                      </button>
                  );
              })}
              
          </div>

          {/* ACTION BUTTON */}
          <button
                 onClick={() => selectedPlan && initiatePurchase(selectedPlan)}
                 className={`w-full py-4 rounded-full font-bold text-sm tracking-wide shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] ${
                     tierType === 'BASIC' 
                        ? 'bg-cyan-500 text-black hover:bg-cyan-400 shadow-cyan-500/20' 
                        : 'bg-white text-black hover:bg-slate-200 shadow-white/10'
                 }`}
             >
                 Get {tierType === 'BASIC' ? 'Pro' : 'Max'}
          </button>


          {/* COIN STORE (Minimalist) */}
          <div className="mt-16 border-t border-slate-900 pt-8">
              <div className="flex items-center justify-between mb-6">
                  <span className="text-slate-400 font-serif text-lg">Top-up Coins</span>
                  <Zap size={20} className="text-amber-500" />
              </div>

              <div className="grid grid-cols-3 gap-3">
                  {packages.slice(0, 6).map(pkg => {
                      let finalPrice = pkg.price;
                      // Apply Discount Logic to Credits too if applicable
                      if (activeEvent) {
                          const eventDiscount = (isSubscribed ? (event?.renewalDiscountPercent || event?.discountPercent) : event?.discountPercent) || 0;
                          if ((isSubscribed && event?.showToPremiumUsers) || (!isSubscribed && event?.showToFreeUsers)) {
                              finalPrice = Math.round(pkg.price * (1 - eventDiscount / 100));
                          }
                      }

                      return (
                          <button
                              key={pkg.id}
                              onClick={() => initiatePurchase({...pkg, price: finalPrice})}
                              className="bg-slate-900 border border-slate-800 p-3 rounded-xl hover:bg-slate-800 hover:border-slate-700 transition-all text-center group"
                          >
                              <p className="text-white font-bold text-md mb-1">{pkg.credits}</p>
                              <p className="text-slate-500 text-[10px] uppercase font-bold">
                                  {finalPrice < pkg.price ? (
                                      <>
                                          <span className="line-through mr-1 opacity-50">₹{pkg.price}</span>
                                          <span className="text-green-400">₹{finalPrice}</span>
                                      </>
                                  ) : `₹${pkg.price}`}
                              </p>
                          </button>
                      );
                  })}
              </div>
          </div>

      </div>
    </div>
  );
};
