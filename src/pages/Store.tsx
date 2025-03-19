
import React, { useState } from 'react';
import { ArrowLeft, Coins, CreditCard } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { purchaseCoins } from '@/services/coinService';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const Store = () => {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);

  const coinPackages = [
    { amount: 5, price: 4.95, label: "Starter Pack" },
    { amount: 10, price: 9.90, label: "Regular Pack", popular: true },
    { amount: 20, price: 18.90, label: "Value Pack" },
  ];

  const handlePurchase = async (amount: number) => {
    if (!user) {
      toast.error("Please sign in to purchase coins");
      navigate("/login");
      return;
    }

    setIsProcessing(true);
    try {
      // In a real app, this would integrate with a payment processor
      const success = await purchaseCoins(user.id, amount);
      
      if (success) {
        toast.success(`Successfully purchased ${amount} coins!`);
      } else {
        toast.error("Purchase failed");
      }
    } catch (error) {
      toast.error("Failed to process purchase");
    } finally {
      setIsProcessing(false);
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

        <div className="w-full p-8 rounded-xl glass-panel">
          <div className="text-center mb-8">
            <div className="inline-block px-3 py-1 mb-2 text-xs font-medium text-primary bg-primary/10 rounded-full">
              Premium Features
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">Coin Store</h2>
            <p className="text-gray-500 mb-2">
              Purchase coins to upload files larger than 100MB
            </p>
            {user && (
              <p className="text-sm font-medium text-primary">
                Current Balance: {user.coins} {user.coins === 1 ? "coin" : "coins"}
              </p>
            )}
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {coinPackages.map((pkg) => (
              <div 
                key={pkg.amount}
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
                    onClick={() => handlePurchase(pkg.amount)}
                    disabled={isProcessing}
                    className="w-full"
                    variant={pkg.popular ? "default" : "outline"}
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    {isProcessing ? "Processing..." : "Purchase"}
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
              <li>In a real app, payments would be processed securely</li>
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
