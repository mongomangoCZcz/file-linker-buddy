
import React, { createContext, useContext, useState, useEffect } from "react";
import { User, AuthContextType } from "@/types/user";
import { toast } from "sonner";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ 
  children 
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error("Failed to parse user from localStorage:", error);
      }
    }
    setIsLoading(false);
  }, []);

  // Get client IP address (in a real app, this would be done server-side)
  const getIpAddress = async (): Promise<string> => {
    try {
      // For demo purposes only - in production this should be done server-side
      const response = await fetch("https://api.ipify.org?format=json");
      const data = await response.json();
      return data.ip;
    } catch (error) {
      console.error("Failed to get IP address:", error);
      return "unknown";
    }
  };

  // Check if IP has reached account limit
  const checkIpLimit = async () => {
    const ipAddress = await getIpAddress();
    const users = Object.values(localStorage)
      .filter(item => {
        try {
          const parsed = JSON.parse(item);
          return parsed.id && parsed.ipAddress;
        } catch {
          return false;
        }
      })
      .map(item => JSON.parse(item));
    
    const accountsFromSameIp = users.filter(u => u.ipAddress === ipAddress).length;
    
    if (accountsFromSameIp >= 2) {
      throw new Error("Account limit reached for this IP address (max 2 accounts)");
    }
    
    return ipAddress;
  };

  const register = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // Check for duplicate email
      const existingUsers = Object.values(localStorage)
        .filter(item => {
          try {
            return JSON.parse(item).email === email;
          } catch {
            return false;
          }
        });
      
      if (existingUsers.length > 0) {
        throw new Error("Email already exists");
      }
      
      // Check IP limit
      const ipAddress = await checkIpLimit();
      
      // Create user
      const newUser: User = {
        id: Math.random().toString(36).substring(2, 15),
        email,
        createdAt: new Date().toISOString(),
        ipAddress,
        coins: 1, // New accounts get 1 free coin
      };
      
      // Store user and credentials
      localStorage.setItem(`user_${newUser.id}`, JSON.stringify(newUser));
      localStorage.setItem(`credentials_${email}`, JSON.stringify({ email, password }));
      
      // Set user in state
      setUser(newUser);
      localStorage.setItem("user", JSON.stringify(newUser));
      
      toast.success("Account created successfully! You've received 1 free coin.");
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Registration failed");
      }
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const storedCredentials = localStorage.getItem(`credentials_${email}`);
      
      if (!storedCredentials) {
        throw new Error("Invalid email or password");
      }
      
      const credentials = JSON.parse(storedCredentials);
      
      if (credentials.password !== password) {
        throw new Error("Invalid email or password");
      }
      
      // Find user by email
      const users = Object.keys(localStorage)
        .filter(key => key.startsWith("user_"))
        .map(key => JSON.parse(localStorage.getItem(key) || "{}"));
      
      const foundUser = users.find(u => u.email === email);
      
      if (!foundUser) {
        throw new Error("User not found");
      }
      
      setUser(foundUser);
      localStorage.setItem("user", JSON.stringify(foundUser));
      
      toast.success("Logged in successfully");
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Login failed");
      }
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
    toast.success("Logged out successfully");
  };

  const value = {
    user,
    isLoading,
    login,
    register,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
