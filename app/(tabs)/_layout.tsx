import { Tabs } from 'expo-router';
import { StyleSheet, View, Text } from 'react-native';

function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const icons: Record<string, string> = {
    game: '🎮',
    leaderboard: '🏆',
    profile: '👤',
  };
  
  return (
    <View style={[styles.iconContainer, focused && styles.iconFocused]}>
      <Text style={styles.icon}>{icons[name] || '•'}</Text>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#06b6d4',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
        headerShown: true,
        headerStyle: styles.header,
        headerTitleStyle: styles.headerTitle,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Game',
          tabBarIcon: ({ focused }) => <TabIcon name="game" focused={focused} />,
          headerTitle: 'map.play',
        }}
      />
      <Tabs.Screen
        name="leaderboard"
        options={{
          title: 'Leaderboard',
          tabBarIcon: ({ focused }) => <TabIcon name="leaderboard" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => <TabIcon name="profile" focused={focused} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#1F2937',
    borderTopColor: '#374151',
    borderTopWidth: 1,
    height: 60,
    paddingBottom: 8,
    paddingTop: 8,
  },
  tabBarLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  header: {
    backgroundColor: '#1F2937',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  iconContainer: {
    padding: 4,
    borderRadius: 8,
  },
  iconFocused: {
    backgroundColor: 'rgba(6, 182, 212, 0.2)',
  },
  icon: {
    fontSize: 20,
  },
});
