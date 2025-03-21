
import { toast } from "sonner";
import { User } from "@/types/user";

export interface CoinPurchase {
  id: string;
  userId: string;
  amount: number;
  cost: number;
  date: string;
}

// Mock function to simulate Stripe checkout session creation
export const createCheckoutSession = async (
  userId: string, 
  amount: number, 
  pricePerCoin: number
): Promise<string> => {
  try {
    // In a real implementation, this would make an API call to your backend
    // which would then create a Stripe checkout session
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Create a mock checkout ID (in real implementation, this would come from Stripe)
    const checkoutId = `cs_${Math.random().toString(36).substring(2, 15)}`;
    
    // Store checkout information in localStorage for demo purposes
    localStorage.setItem(`checkout_${checkoutId}`, JSON.stringify({
      userId,
      amount,
      cost: amount * pricePerCoin,
      status: 'pending',
      created: new Date().toISOString()
    }));
    
    return checkoutId;
  } catch (error) {
    console.error("Failed to create checkout session:", error);
    throw error;
  }
};

// Function to process successful payment (in real app, this would be called by a webhook)
export const processPayment = async (checkoutId: string): Promise<boolean> => {
  try {
    // Get checkout data
    const checkoutData = localStorage.getItem(`checkout_${checkoutId}`);
    if (!checkoutData) {
      throw new Error("Checkout session not found");
    }
    
    const checkout = JSON.parse(checkoutData);
    if (checkout.status !== 'pending') {
      throw new Error("Checkout already processed");
    }
    
    // Update checkout status
    checkout.status = 'completed';
    localStorage.setItem(`checkout_${checkoutId}`, JSON.stringify(checkout));
    
    // Add coins to user
    return await purchaseCoins(checkout.userId, checkout.amount);
  } catch (error) {
    console.error("Failed to process payment:", error);
    return false;
  }
};

// Mock function for purchasing coins (in real app, this would connect to a payment provider)
export const purchaseCoins = async (userId: string, amount: number): Promise<boolean> => {
  try {
    // Simulate payment processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Calculate cost (in a real app, this would be handled by a payment provider)
    const cost = amount * 0.99; // $0.99 per coin
    
    // Create purchase record
    const purchase: CoinPurchase = {
      id: Math.random().toString(36).substring(2, 15),
      userId,
      amount,
      cost,
      date: new Date().toISOString()
    };
    
    // Store purchase record
    localStorage.setItem(`purchase_${purchase.id}`, JSON.stringify(purchase));
    
    // Update user's coin balance
    const userJson = localStorage.getItem(`user_${userId}`);
    if (userJson) {
      const user = JSON.parse(userJson);
      user.coins += amount;
      localStorage.setItem(`user_${userId}`, JSON.stringify(user));
      
      // Update current user if it's the active user
      const currentUserJson = localStorage.getItem("user");
      if (currentUserJson) {
        const currentUser = JSON.parse(currentUserJson);
        if (currentUser.id === userId) {
          currentUser.coins = user.coins;
          localStorage.setItem("user", JSON.stringify(currentUser));
        }
      }
    }
    
    return true;
  } catch (error) {
    console.error("Failed to purchase coins:", error);
    return false;
  }
};

// Function to use a coin
export const useCoin = async (userId: string): Promise<{ success: boolean, updatedUser?: User }> => {
  try {
    // Get user
    const userJson = localStorage.getItem(`user_${userId}`);
    if (!userJson) {
      toast.error("User not found");
      return { success: false };
    }
    
    const user = JSON.parse(userJson);
    
    // Check if user has enough coins
    if (user.coins < 1) {
      toast.error("Not enough coins. Please purchase more.");
      return { success: false };
    }
    
    // Deduct coin
    user.coins -= 1;
    localStorage.setItem(`user_${userId}`, JSON.stringify(user));
    
    // Update current user if it's the active user
    const currentUserJson = localStorage.getItem("user");
    if (currentUserJson) {
      const currentUser = JSON.parse(currentUserJson);
      if (currentUser.id === userId) {
        currentUser.coins = user.coins;
        localStorage.setItem("user", JSON.stringify(currentUser));
      }
    }
    
    return { success: true, updatedUser: user };
  } catch (error) {
    console.error("Failed to use coin:", error);
    return { success: false };
  }
};
