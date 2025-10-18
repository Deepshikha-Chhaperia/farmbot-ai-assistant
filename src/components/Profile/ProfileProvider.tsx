import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface FarmerProfile {
  name: string;
  cropType: string;
  village: string;
  language: string;
  isComplete: boolean;
  userId?: string; // Added to track user identity
  createdAt?: string;
}

interface ProfileContextType {
  profile: FarmerProfile | null;
  userId: string;
  updateProfile: (profileData: Partial<FarmerProfile>) => void;
  clearProfile: () => void;
  isProfileComplete: () => boolean;
  resetUserSession: () => void; // New function to create fresh session
}

const defaultProfile: FarmerProfile = {
  name: '',
  cropType: '',
  village: '',
  language: 'hi-IN',
  isComplete: false
};

// Generate a secure, unique user ID for each session
const generateUserId = (): string => {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2);
  const browserFingerprint = [
    navigator.userAgent,
    screen.width,
    screen.height,
    new Date().getTimezoneOffset(),
    navigator.language,
    Math.random()
  ].join('|');
  const hashCode = browserFingerprint.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  return `farmer_${timestamp}_${randomStr}_${Math.abs(hashCode).toString(36)}`;
};

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
};

interface ProfileProviderProps {
  children: ReactNode;
}

export const ProfileProvider: React.FC<ProfileProviderProps> = ({ children }) => {
  const [profile, setProfile] = useState<FarmerProfile | null>(null);
  const [userId, setUserId] = useState<string>('');

  // Initialize or load user session on mount
  useEffect(() => {
    try {
      // Check if there's an existing session ID
      let currentUserId = sessionStorage.getItem('farmbot_user_session');
      
      if (!currentUserId) {
        // Create new user session - each browser tab gets unique ID
        currentUserId = generateUserId();
        sessionStorage.setItem('farmbot_user_session', currentUserId);
        console.log('New user session created:', currentUserId);
      } else {
        console.log('Existing user session found:', currentUserId);
      }
      
      setUserId(currentUserId);
      
      // Load profile specific to this user ID
      const profileKey = `farmbot_profile_${currentUserId}`;
      const savedProfile = localStorage.getItem(profileKey);
      
      if (savedProfile) {
        const parsedProfile = JSON.parse(savedProfile);
        console.log('Loaded user-specific profile:', parsedProfile);
        setProfile(parsedProfile);
      } else {
        // Create new profile for this user
        const newProfile = {
          ...defaultProfile,
          userId: currentUserId,
          createdAt: new Date().toISOString()
        };
        setProfile(newProfile);
        console.log('Created new profile for user:', currentUserId);
      }
    } catch (error) {
      console.error('Error initializing user session:', error);
      // Fallback: create new session
      const fallbackUserId = generateUserId();
      setUserId(fallbackUserId);
      setProfile({ ...defaultProfile, userId: fallbackUserId, createdAt: new Date().toISOString() });
    }
  }, []);

  // Save profile to localStorage whenever it changes (user-specific key)
  useEffect(() => {
    if (profile && userId) {
      try {
        const profileKey = `farmbot_profile_${userId}`;
        localStorage.setItem(profileKey, JSON.stringify(profile));
        console.log('Profile saved for user:', userId);
        
        // Also save session info with metadata
        const sessionInfo = {
          userId,
          lastAccessed: new Date().toISOString(),
          profileComplete: profile.isComplete
        };
        sessionStorage.setItem('farmbot_session_info', JSON.stringify(sessionInfo));
      } catch (error) {
        console.error('Error saving profile:', error);
      }
    }
  }, [profile, userId]);

  const updateProfile = (profileData: Partial<FarmerProfile>) => {
    setProfile(prevProfile => {
      const updatedProfile = { 
        ...prevProfile, 
        ...profileData 
      } as FarmerProfile;
      
      // Check if profile is complete
      const isComplete = updatedProfile.name.trim() !== '' && 
                        updatedProfile.cropType.trim() !== '' && 
                        updatedProfile.village.trim() !== '';
      
      updatedProfile.isComplete = isComplete;
      
      console.log('Profile updated:', updatedProfile);
      return updatedProfile;
    });
  };

  const clearProfile = () => {
    if (userId) {
      // Clear user-specific profile data
      const profileKey = `farmbot_profile_${userId}`;
      localStorage.removeItem(profileKey);
      console.log('Profile cleared for user:', userId);
    }
    // Also clear old format for compatibility
    localStorage.removeItem('farmbot_farmer_profile');
    setProfile({ ...defaultProfile, userId, createdAt: new Date().toISOString() });
  };

  const resetUserSession = () => {
    // Clear current session
    sessionStorage.removeItem('farmbot_user_session');
    sessionStorage.removeItem('farmbot_session_info');
    
    // Create completely new session
    const newUserId = generateUserId();
    sessionStorage.setItem('farmbot_user_session', newUserId);
    setUserId(newUserId);
    
    // Create fresh profile for new user
    const newProfile = {
      ...defaultProfile,
      userId: newUserId,
      createdAt: new Date().toISOString()
    };
    setProfile(newProfile);
    
    console.log('User session reset. New user:', newUserId);
  };

  const isProfileComplete = (): boolean => {
    return profile?.isComplete || false;
  };

  const contextValue: ProfileContextType = {
    profile,
    userId,
    updateProfile,
    clearProfile,
    isProfileComplete,
    resetUserSession
  };

  return (
    <ProfileContext.Provider value={contextValue}>
      {children}
    </ProfileContext.Provider>
  );
};

