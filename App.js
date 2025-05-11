import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from './screens/HomeScreen';
import DetailScreen from './screens/DetailScreen';
import MovieSearchScreen from './screens/MovieSearchScreen';
import MovieDetailScreen from './screens/MovieDetailScreen'; // Importación corregida
import MusicDetailScreen from './screens/MusicDetailScreen';
import MusicSearchScreen from './screens/MusicSearchScreen';
import AlbumDetailsScreen from './screens/AlbumDetailsScreen';
import ArtistDetailsScreen from './screens/ArtistDetailScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Inicio" component={HomeScreen} />
        <Stack.Screen name="BuscarPelículas" component={MovieSearchScreen} />
        <Stack.Screen name="DetalleLibro" component={DetailScreen} />
        <Stack.Screen name="DetallePelícula" component={MovieDetailScreen} />
        <Stack.Screen name="BuscarMúsica" component={MusicSearchScreen} />
        <Stack.Screen name="DetalleMúsica" component={MusicDetailScreen} />
        <Stack.Screen name="DetallesÁlbum" component={AlbumDetailsScreen} />
        <Stack.Screen name="DetallesArtista" component={ArtistDetailsScreen} />
      </Stack.Navigator>
      <StatusBar style="auto" />
    </NavigationContainer>
  );
}
