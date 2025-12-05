import { Tabs } from 'expo-router';
import { Heart, BookHeart, User } from 'lucide-react-native';
import { colors } from '../../constants/colors';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary.dustyBlue,
        tabBarInactiveTintColor: colors.functional.textSecondary,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.neutral.white,
          borderTopColor: colors.functional.border,
          borderTopWidth: 1,
        },
      }}
    >
      <Tabs.Screen
        name="pray"
        options={{
          title: 'Pray',
          tabBarIcon: ({ color, size }) => <Heart size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="prayers"
        options={{
          title: 'My Prayers',
          tabBarIcon: ({ color, size }) => <BookHeart size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
