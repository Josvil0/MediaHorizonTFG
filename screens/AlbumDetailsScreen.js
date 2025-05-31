// Importaciones necesarias desde React y librerías externas
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient'; // Para fondo con degradado
import { Ionicons } from '@expo/vector-icons'; // Iconos vectoriales
import CommentsSection from '../Components/ComentsSection'; // Componente personalizado de comentarios

// Componente principal de la pantalla de detalles del álbum
export default function AlbumDetailsScreen({ route, navigation }) {
  const { albumId } = route.params; // Se obtiene el ID del álbum desde los parámetros de navegación
  const [album, setAlbum] = useState(null); // Estado para almacenar la info del álbum
  const [tracks, setTracks] = useState([]); // Estado para almacenar la lista de canciones
  const [loading, setLoading] = useState(true); // Estado para mostrar si está cargando

  useEffect(() => {
    // Función asincrónica que obtiene los detalles del álbum desde la API de Deezer
    const fetchAlbumDetails = async () => {
      try {
        const url = `https://proxy-media-horizon.vercel.app/api/proxy?url=https://api.deezer.com/album/${albumId}`;
        const response = await fetch(url); // Llamada a API vía proxy
        const data = await response.json();
        setAlbum(data); // Guardamos la información del álbum
        setTracks(data.tracks.data); // Guardamos las canciones
      } catch (error) {
        // Manejo de errores en caso de que la llamada a la API falle
        console.error('Error al obtener datos del álbum:', error);
      } finally {
        setLoading(false); // Terminamos de cargar
      }
    };

    fetchAlbumDetails(); // Se ejecuta al montar el componente
  }, [albumId]);

  return (
    <LinearGradient colors={['#fafafa', '#f0f0ff']} style={styles.gradient}>
      <View style={styles.container}>
        {/* Botón de regreso */}
        <TouchableOpacity
          style={{ position: 'absolute', top: 40, left: 16, zIndex: 10 }}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={28} color="#6366F1" />
        </TouchableOpacity>

        {/* Vista de carga */}
        {loading ? (
          <Text style={styles.loadingText}>Cargando canciones...</Text>
        ) : (
          <>
            {/* Imagen del álbum */}
            <Image source={{ uri: album.cover_big }} style={styles.image} />

            {/* Título y artista */}
            <Text style={styles.title}>{album.title}</Text>
            <Text style={styles.artist}>Por: {album.artist.name}</Text>
            <Text style={styles.info}>Fecha de lanzamiento: {album.release_date}</Text>

            {/* Sección de comentarios */}
            <View style={styles.infoContainer}>
              <CommentsSection itemType="album" itemId={album.id.toString()} />
            </View>

            {/* Lista de canciones */}
            <Text style={styles.sectionTitle}>Canciones</Text>
            <FlatList
              data={tracks}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.trackCard}
                  onPress={() => navigation.navigate('DetalleMúsica', { track: item })}
                >
                  <Image source={{ uri: item.album.cover_medium }} style={styles.trackImage} />
                  <View style={styles.trackInfo}>
                    <Text style={styles.trackTitle}>{item.title}</Text>
                    <Text style={styles.trackDuration}>
                      Duración: {Math.floor(item.duration / 60)}:{item.duration % 60}s
                      {/* Podrías mejorar esto con `.padStart(2, '0')` para los segundos */}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
            />
          </>
        )}
      </View>
    </LinearGradient>
  );
}

// Estilos para la pantalla
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
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  artist: {
    fontSize: 18,
    color: '#6B7280',
    marginBottom: 4,
    textAlign: 'center',
  },
  info: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 16,
    textAlign: 'center',
  },
  infoContainer: {
    padding: 16,
    width: '100%',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 20,
    marginBottom: 10,
  },
  trackCard: {
    marginBottom: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
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
});
