// Este es el archivo principal de la app.
// Aquí se gestiona la navegación, la sesión del usuario y el flujo de completar perfil.
// Si el usuario no está logueado, muestra la pantalla de login.
// Si está logueado pero no tiene perfil, le obliga a completarlo.
// Si todo está bien, muestra las pestañas principales de la app.

import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import supabase from './Services/supabaseClient';
import { ActivityIndicator, View, Image } from 'react-native';

import HomeScreen from './screens/HomeScreen';
import MovieSearchScreen from './screens/MovieSearchScreen';
import MusicSearchScreen from './screens/MusicSearchScreen';
import DetailScreen from './screens/DetailScreen';
import MovieDetailScreen from './screens/MovieDetailScreen';
import MusicDetailScreen from './screens/MusicDetailScreen';
import AlbumDetailsScreen from './screens/AlbumDetailsScreen';
import ArtistDetailsScreen from './screens/ArtistDetailScreen';
import AuthScreen from './screens/AuthScreen';
import CompleteProfileScreen from './screens/CompleteProfileScreen';
import ProfileScreen from './screens/ProfileScreen';
import UserProfileScreen from './screens/UserProfileScreen';
import FeedScreen from './screens/FeedScreen';
import FeedDetailScreen from './screens/FeedDetailScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Navegador de pestañas para la búsqueda (libros, pelis, música)
function SearchTabs() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Inicio" component={HomeScreen} />
      <Stack.Screen name="BuscarPelículas" component={MovieSearchScreen} />
      <Stack.Screen name="BuscarMúsica" component={MusicSearchScreen} />
      <Stack.Screen name="DetalleLibro" component={DetailScreen} />
      <Stack.Screen name="DetallePelícula" component={MovieDetailScreen} />
      <Stack.Screen name="DetalleMúsica" component={MusicDetailScreen} />
      <Stack.Screen name="DetallesÁlbum" component={AlbumDetailsScreen} />
      <Stack.Screen name="DetallesArtista" component={ArtistDetailsScreen} />
    </Stack.Navigator>
  );
}

// Navegador principal de pestañas (Feed, Buscar, Perfil)
function MainTabs({ avatarUrl, refreshAvatar }) {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#6366F1',
        tabBarInactiveTintColor: '#6B7280',
        tabBarStyle: { backgroundColor: '#fff', borderTopWidth: 0, elevation: 8 },
        tabBarIcon: ({ color, size, focused }) => {
          // Iconos para cada pestaña
          if (route.name === 'Feed') return <Ionicons name="people-circle" size={size} color={color} />;
          if (route.name === 'Buscar') return <Ionicons name="search" size={size} color={color} />;
          if (route.name === 'Perfil') {
            // Si el usuario tiene avatar, lo muestra en la pestaña
            if (avatarUrl) {
              return (
                <Image
                  source={{ uri: avatarUrl }}
                  style={{
                    width: size,
                    height: size,
                    borderRadius: size / 2,
                    borderWidth: focused ? 2 : 0,
                    borderColor: focused ? '#6366F1' : 'transparent',
                  }}
                />
              );
            }
            return <Ionicons name="person-circle" size={size} color={color} />;
          }
        },
      })}
    >
      <Tab.Screen name="Feed" component={FeedScreen} />
      <Tab.Screen name="Buscar" component={SearchTabs} />
      <Tab.Screen name="Perfil">
        {props => <ProfileScreen {...props} refreshAvatar={refreshAvatar} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

export default function App() {
  // Estado para la sesión del usuario
  const [session, setSession] = useState(null);
  // Estado para saber si está comprobando el perfil
  const [checkingProfile, setCheckingProfile] = useState(false);
  // Estado para saber si el usuario necesita completar perfil
  const [needsProfile, setNeedsProfile] = useState(false);
  // Estado para la URL del avatar (para la pestaña de perfil)
  const [avatarUrl, setAvatarUrl] = useState(null);

  // Al montar, escucha los cambios de sesión (login/logout)
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => setSession(session));
    return () => { listener.subscription.unsubscribe(); };
  }, []);

  // Cuando cambia la sesión, comprueba si el usuario tiene perfil en la tabla 'users'
  useEffect(() => {
    const checkProfile = async () => {
      if (session) {
        setCheckingProfile(true);
        const { data: { user } } = await supabase.auth.getUser();
        const { data: perfil } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();
        if (!perfil) {
          // Si no tiene perfil, obliga a completarlo
          setNeedsProfile(true);
          setCheckingProfile(false);
          return;
        }
        // Si tiene perfil, guarda el avatar y sigue normal
        setNeedsProfile(false);
        setAvatarUrl(perfil?.avatar_url || null);
        setCheckingProfile(false);
      }
    };
    if (session) checkProfile();
  }, [session]);

  // Función para refrescar el avatar (por ejemplo, tras editar el perfil)
  const refreshAvatar = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data: perfil } = await supabase
      .from('users')
      .select('avatar_url')
      .eq('id', user.id)
      .single();
    setAvatarUrl(perfil?.avatar_url || null);
  };

  // Debug en consola para ver el estado de la sesión y el perfil
  console.log('session:', session);
  console.log('needsProfile:', needsProfile);
  console.log('checkingProfile:', checkingProfile);

  // Si no hay sesión, muestra la pantalla de login
  if (!session) {
    return (
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Auth" component={AuthScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    );
  }

  // Si está comprobando el perfil, muestra un spinner de carga
  if (checkingProfile) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f9fafb' }}>
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );
  }

  // Si necesita completar el perfil, muestra la pantalla de completar perfil
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {needsProfile ? (
          <Stack.Screen name="CompleteProfile" component={CompleteProfileScreen} />
        ) : (
          <>
            <Stack.Screen name="MainTabs">
              {props => <MainTabs {...props} avatarUrl={avatarUrl} refreshAvatar={refreshAvatar} />}
            </Stack.Screen>
            <Stack.Screen name="FeedDetail" component={FeedDetailScreen} />
            <Stack.Screen name="UserProfile" component={UserProfileScreen} />
          </>
        )}
      </Stack.Navigator>
      <StatusBar style="auto" />
    </NavigationContainer>
  );
}

// Los estilos no están aquí porque la navegación usa los estilos por defecto de React Navigation.
