
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Coins, CreditCard, Loader2, CheckCircle } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@/types/user';

const Store = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isLoading, updateUser } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingPackage, setProcessingPackage] = useState<string | null>(null);
  const [localUserState, setLocalUserState] = useState<User | null>(user);
  const [showSuccess, setShowSuccess] = useState(false);
  const [purchasedCoins, setPurchasedCoins] = useState(0);

  // Update local user state when the auth context user changes
  useEffect(() => {
    if (user) {
      setLocalUserState(user);
    }
  }, [user]);

  // Handle successful payment redirect
  useEffect(() => {
    const success = searchParams.get('success');
    const coins = searchParams.get('coins');
    const userId = searchParams.get('userId');
    const sessionId = searchParams.get('session_id');
    
    if (success === 'true' && coins && userId && sessionId) {
      // Check if this payment session has already been processed
      const processedKey = `payment_processed_${sessionId}`;
      if (sessionStorage.getItem(processedKey)) {
        // Already processed, just clear the URL and return
        window.history.replaceState({}, '', '/store');
        return;
      }
      
      // Mark this session as processed to prevent duplicate coin crediting
      sessionStorage.setItem(processedKey, 'true');
      
      const coinAmount = parseInt(coins, 10);
      setPurchasedCoins(coinAmount);
      setShowSuccess(true);
      
      // Update user's coin balance in localStorage
      const userJson = localStorage.getItem(`user_${userId}`);
      if (userJson) {
        const userData = JSON.parse(userJson);
        userData.coins += coinAmount;
        localStorage.setItem(`user_${userId}`, JSON.stringify(userData));
        
        // Update current user if it's the active user
        const currentUserJson = localStorage.getItem("user");
        if (currentUserJson) {
          const currentUser = JSON.parse(currentUserJson);
          if (currentUser.id === userId) {
            currentUser.coins = userData.coins;
            localStorage.setItem("user", JSON.stringify(currentUser));
            setLocalUserState(currentUser);
            updateUser(currentUser);
          }
        }
      }
      
      toast.success(`Successfully purchased ${coinAmount} coins!`);
      
      // Clear URL params after processing
      window.history.replaceState({}, '', '/store');
      
      // Hide success message after 5 seconds
      setTimeout(() => setShowSuccess(false), 5000);
    }
    
    if (searchParams.get('canceled') === 'true') {
      toast.error('Payment was canceled');
      window.history.replaceState({}, '', '/store');
    }
  }, [searchParams, updateUser]);

  const coinPackages = [
    { id: 'starter', amount: 5, price: 4.95, label: "Starter Pack" },
    { id: 'regular', amount: 10, price: 9.90, label: "Regular Pack", popular: true },
    { id: 'value', amount: 20, price: 18.90, label: "Value Pack" },
  ];

  const handlePurchase = async (packageId: string) => {
    if (!user) {
      toast.error("Please sign in to purchase coins");
      navigate("/login");
      return;
    }

    try {
      setIsProcessing(true);
      setProcessingPackage(packageId);
      
      // Call edge function to create Stripe checkout session
      const { data, error } = await supabase.functions.invoke('create-coin-checkout', {
        body: {
          packageId,
          userId: user.id,
          userEmail: user.email,
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data?.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error) {
      console.error("Payment error:", error);
      toast.error("Failed to initiate payment. Please try again.");
    } finally {
      setIsProcessing(false);
      setProcessingPackage(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-blue-50 to-white">
      <div className="w-full max-w-3xl flex flex-col items-center justify-center animate-fade-in">
        <Link to="/" className="self-start mb-8 flex items-center text-gray-600 hover:text-gray-900 subtle-transition">
          <ArrowLeft className="w-4 h-4 mr-1" />
          <span>Back to upload</span>
        </Link>

        {showSuccess && (
          <div className="w-full mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
            <CheckCircle className="h-6 w-6 text-green-600" />
            <div>
              <p className="font-medium text-green-800">Payment Successful!</p>
              <p className="text-sm text-green-600">{purchasedCoins} coins have been added to your account.</p>
            </div>
          </div>
        )}

        <div className="w-full p-8 rounded-xl glass-panel">
          <div className="text-center mb-8">
            <div className="inline-block px-3 py-1 mb-2 text-xs font-medium text-primary bg-primary/10 rounded-full">
              Premium Features
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">Coin Store</h2>
            <p className="text-gray-500 mb-2">
              Purchase coins to upload files larger than 100MB
            </p>
            {localUserState && (
              <p className="text-sm font-medium text-primary">
                Current Balance: {localUserState.coins} {localUserState.coins === 1 ? "coin" : "coins"}
              </p>
            )}
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {coinPackages.map((pkg) => (
              <div 
                key={pkg.id}
                className={`p-6 rounded-lg border relative ${
                  pkg.popular ? 'border-primary shadow-md' : 'border-gray-200'
                }`}
              >
                {pkg.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary text-white px-3 py-1 rounded-full text-xs font-medium">
                    Most Popular
                  </div>
                )}
                <div className="flex flex-col items-center">
                  <Coins className={`w-10 h-10 mb-3 ${pkg.popular ? 'text-primary' : 'text-gray-500'}`} />
                  <h3 className="text-lg font-medium mb-1">{pkg.label}</h3>
                  <div className="text-2xl font-bold mb-1">{pkg.amount} Coins</div>
                  <div className="text-gray-500 mb-4">${pkg.price.toFixed(2)}</div>
                  <Button
                    onClick={() => handlePurchase(pkg.id)}
                    disabled={isProcessing}
                    className="w-full"
                    variant={pkg.popular ? "default" : "outline"}
                  >
                    {processingPackage === pkg.id ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-4 h-4 mr-2" />
                        Purchase
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 text-sm text-gray-500 bg-gray-50 p-4 rounded-lg">
            <p className="font-medium mb-2">How Coins Work:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Each coin allows you to upload one file larger than 100MB</li>
              <li>New accounts receive 1 free coin</li>
              <li>Coins never expire</li>
              <li>Payments are processed securely via Stripe</li>
            </ul>
          </div>
        </div>
      </div>
      
      <footer className="mt-16 text-center text-sm text-gray-500">
        <p>Designed with simplicity in mind • {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
};

export default Store;
