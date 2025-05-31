// Importa hooks de React y componentes de React Native
import React, { useEffect, useState } from 'react';
import { View, Text, Image, FlatList, TouchableOpacity, StyleSheet } from 'react-native';

// Importa el componente para fondos con degradado
import { LinearGradient } from 'expo-linear-gradient';

// Importa los íconos de Ionicons
import { Ionicons } from '@expo/vector-icons';

// Importa el componente de comentarios personalizado
import CommentsSection from '../Components/ComentsSection';

// Componente principal que muestra los detalles del artista
export default function ArtistDetailsScreen({ route, navigation }) {
  // Extrae el ID del artista pasado como parámetro de navegación
  const { artistId } = route.params;

  // Estado que guarda los datos del artista
  const [artist, setArtist] = useState(null);

  // Estado que guarda las canciones más populares del artista
  const [topTracks, setTopTracks] = useState([]);

  // Hook que se ejecuta al montar el componente o cambiar artistId
  useEffect(() => {
    const fetchArtistDetails = async () => {
      try {
        // URLs para obtener los datos del artista y sus canciones más escuchadas
        const artistUrl = `https://proxy-media-horizon.vercel.app/api/proxy?url=https://api.deezer.com/artist/${artistId}`;
        const topTracksUrl = `https://proxy-media-horizon.vercel.app/api/proxy?url=https://api.deezer.com/artist/${artistId}/top`;

        // Realiza ambas peticiones en paralelo
        const [artistResponse, topTracksResponse] = await Promise.all([
          fetch(artistUrl),
          fetch(topTracksUrl),
        ]);

        // Convierte las respuestas en JSON
        const artistData = await artistResponse.json();
        const topTracksData = await topTracksResponse.json();

        // Guarda los datos en el estado
        setArtist(artistData);
        setTopTracks(topTracksData.data);
      } catch (error) {
        // Si ocurre un error, lo muestra por consola
        console.error('Error fetching artist details:', error);
      }
    };

    // Llama a la función para obtener los datos
    fetchArtistDetails();
  }, [artistId]); // Dependencia: se ejecuta cuando cambia artistId

  return (
    // Fondo con degradado usando LinearGradient
    <LinearGradient colors={['#fafafa', '#f0f0ff']} style={styles.gradient}>
      <View style={styles.container}>

        {/* Botón para volver atrás */}
        <TouchableOpacity
          style={{ position: 'absolute', top: 40, left: 16, zIndex: 10 }}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={28} color="#6366F1" />
        </TouchableOpacity>

        {/* Si los datos del artista ya fueron cargados */}
        {artist ? (
          <>
            {/* Imagen del artista */}
            <Image source={{ uri: artist.picture_big }} style={styles.image} />
            
            {/* Nombre del artista */}
            <Text style={styles.name}>{artist.name}</Text>

            {/* Número de fans del artista */}
            <Text style={styles.info}>Fans: {artist.nb_fan.toLocaleString()}</Text>

            {/* Título de la sección de canciones */}
            <Text style={styles.sectionTitle}>Top canciones</Text>

            {/* Lista de canciones más escuchadas */}
            <FlatList
              data={topTracks}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.trackCard}
                  // Navega a la pantalla de detalles de la canción
                  onPress={() => navigation.navigate('DetalleMúsica', { track: item })}
                >
                  {/* Imagen del álbum */}
                  <Image source={{ uri: item.album.cover_medium }} style={styles.trackImage} />
                  
                  {/* Título y duración de la canción */}
                  <View style={styles.trackInfo}>
                    <Text style={styles.trackTitle}>{item.title}</Text>
                    <Text style={styles.trackDuration}>
                      Duración: {Math.floor(item.duration / 60)}:{item.duration % 60}s
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
            />

            {/* Contenedor con información adicional como comentarios */}
            <View style={styles.infoContainer}>
              <CommentsSection itemType="artist" itemId={artist.id.toString()} />
            </View>
          </>
        ) : (
          // Mensaje de carga si aún no hay datos
          <Text style={styles.loadingText}>Cargando información del artista...</Text>
        )}
      </View>
    </LinearGradient>
  );
}

// Estilos del componente
const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#6B7280',
  },
  image: {
    width: 200,
    height: 200,
    borderRadius: 100,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  info: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 16,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 20,
    marginBottom: 10,
  },
  trackCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    width: '100%',
  },
  trackTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  trackDuration: {
    fontSize: 14,
    color: '#6B7280',
  },
  trackImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  trackInfo: {
    flex: 1,
  },
  infoContainer: {
    padding: 16,
    width: '100%',
  },
});
