
import React, { useState } from 'react';
import { ArrowLeft, Coins, CreditCard, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { createCheckoutSession, processPayment } from '@/services/coinService';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { User } from '@/types/user';

const Store = () => {
  const navigate = useNavigate();
  const { user, isLoading, updateUser } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentPackage, setCurrentPackage] = useState<null | { amount: number, price: number }>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'card' | 'processing' | 'success'>('card');
  const [localUserState, setLocalUserState] = useState<User | null>(user);

  // Update local user state when the auth context user changes
  React.useEffect(() => {
    if (user) {
      setLocalUserState(user);
    }
  }, [user]);

  const coinPackages = [
    { amount: 5, price: 4.95, label: "Starter Pack" },
    { amount: 10, price: 9.90, label: "Regular Pack", popular: true },
    { amount: 20, price: 18.90, label: "Value Pack" },
  ];

  const handlePurchase = async (amount: number, price: number) => {
    if (!user) {
      toast.error("Please sign in to purchase coins");
      navigate("/login");
      return;
    }

    setCurrentPackage({ amount, price });
    setShowPaymentDialog(true);
    setPaymentStep('card');
  };

  const handlePaymentSubmit = async () => {
    if (!user || !currentPackage) return;

    try {
      setPaymentStep('processing');
      setIsProcessing(true);
      
      // Create checkout session
      const checkoutId = await createCheckoutSession(
        user.id,
        currentPackage.amount,
        currentPackage.price / currentPackage.amount
      );
      
      // Simulate a payment processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Process the payment with callback to update UI
      const success = await processPayment(checkoutId, (updatedUser) => {
        setLocalUserState(updatedUser);
        updateUser(updatedUser);
      });
      
      if (success) {
        setPaymentStep('success');
        // Wait a bit before closing the modal
        setTimeout(() => {
          setShowPaymentDialog(false);
          toast.success(`Successfully purchased ${currentPackage.amount} coins!`);
        }, 2000);
      } else {
        toast.error("Payment processing failed");
        setShowPaymentDialog(false);
      }
    } catch (error) {
      console.error("Payment error:", error);
      toast.error("Failed to process payment");
      setShowPaymentDialog(false);
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
            {localUserState && (
              <p className="text-sm font-medium text-primary">
                Current Balance: {localUserState.coins} {localUserState.coins === 1 ? "coin" : "coins"}
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
                    onClick={() => handlePurchase(pkg.amount, pkg.price)}
                    disabled={isProcessing}
                    className="w-full"
                    variant={pkg.popular ? "default" : "outline"}
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    Purchase
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
              <li>Payments are processed securely</li>
            </ul>
          </div>
        </div>
      </div>
      
      <footer className="mt-16 text-center text-sm text-gray-500">
        <p>Designed with simplicity in mind • {new Date().getFullYear()}</p>
      </footer>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {paymentStep === 'card' && "Payment Details"}
              {paymentStep === 'processing' && "Processing Payment"}
              {paymentStep === 'success' && "Payment Successful"}
            </DialogTitle>
            <DialogDescription>
              {paymentStep === 'card' && `Purchase ${currentPackage?.amount} coins for $${currentPackage?.price.toFixed(2)}`}
              {paymentStep === 'processing' && "Please wait while we process your payment"}
              {paymentStep === 'success' && `You've successfully purchased ${currentPackage?.amount} coins!`}
            </DialogDescription>
          </DialogHeader>

          {paymentStep === 'card' && (
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Card Information</h3>
                <div className="rounded-md border border-input p-3 text-sm">
                  <p className="text-muted-foreground">Demo Mode: No real payment will be processed</p>
                  <p className="font-medium mt-1">4242 4242 4242 4242</p>
                  <div className="flex justify-between mt-2">
                    <span>Any future date</span>
                    <span>Any 3 digits</span>
                  </div>
                </div>
              </div>

              <Alert>
                <AlertDescription>
                  This is a demo payment system. No real payment will be processed.
                </AlertDescription>
              </Alert>
            </div>
          )}

          {paymentStep === 'processing' && (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
              <p className="text-center text-sm text-muted-foreground">
                Processing your payment...
              </p>
            </div>
          )}

          {paymentStep === 'success' && (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                <Coins className="h-8 w-8 text-green-600" />
              </div>
              <p className="text-center text-sm text-muted-foreground">
                {currentPackage?.amount} coins have been added to your account!
              </p>
            </div>
          )}

          <DialogFooter>
            {paymentStep === 'card' && (
              <Button onClick={handlePaymentSubmit} className="w-full">
                Pay ${currentPackage?.price.toFixed(2)}
              </Button>
            )}
            {paymentStep === 'success' && (
              <Button onClick={() => setShowPaymentDialog(false)} className="w-full">
                Done
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Store;
