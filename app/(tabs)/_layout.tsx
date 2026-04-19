import { Tabs } from 'expo-router';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '../../constants/colors';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { E } from '../../constants/emoji';

function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const icons: Record<string, string> = {
    cookbooks: E.books,
    'meal-plan': E.calendar,
    groceries: E.cart,
    settings: E.gear,
  };
  return <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>{icons[name]}</Text>;
}

export default function TabLayout() {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.muted,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tab_cookbooks'),
          tabBarIcon: ({ focused }) => <TabIcon name="cookbooks" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="meal-plan"
        options={{
          title: t('tab_meal_plan'),
          tabBarIcon: ({ focused }) => <TabIcon name="meal-plan" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          title: '',
          tabBarIcon: () => (
            <View style={styles.fab}>
              <Text style={styles.fabPlus}>+</Text>
            </View>
          ),
          tabBarButton: () => (
            <TouchableOpacity
              style={styles.fabWrapper}
              onPress={() => router.push('/import')}
            >
              <View style={styles.fab}>
                <Text style={styles.fabPlus}>+</Text>
              </View>
            </TouchableOpacity>
          ),
        }}
      />
      <Tabs.Screen
        name="groceries"
        options={{
          title: t('tab_groceries'),
          tabBarIcon: ({ focused }) => <TabIcon name="groceries" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t('tab_settings'),
          tabBarIcon: ({ focused }) => <TabIcon name="settings" focused={focused} />,
        }}
      />
      {/* Hide old more tab */}
      <Tabs.Screen name="more" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#fff',
    borderTopColor: '#E5E0D8',
    borderTopWidth: 1,
    height: 88,
    paddingBottom: 24,
    paddingTop: 8,
  },
  tabLabel: { fontSize: 11, fontWeight: '500' },
  fabWrapper: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOpacity: 0.4,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
    marginTop: -16,
  },
  fabPlus: { color: '#fff', fontSize: 28, fontWeight: '300', lineHeight: 32 },
});
