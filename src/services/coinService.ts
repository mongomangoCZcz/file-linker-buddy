
import { toast } from "sonner";

export interface CoinPurchase {
  id: string;
  userId: string;
  amount: number;
  cost: number;
  date: string;
}

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
export const useCoin = async (userId: string): Promise<boolean> => {
  try {
    // Get user
    const userJson = localStorage.getItem(`user_${userId}`);
    if (!userJson) {
      toast.error("User not found");
      return false;
    }
    
    const user = JSON.parse(userJson);
    
    // Check if user has enough coins
    if (user.coins < 1) {
      toast.error("Not enough coins. Please purchase more.");
      return false;
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
    
    return true;
  } catch (error) {
    console.error("Failed to use coin:", error);
    return false;
  }
};
