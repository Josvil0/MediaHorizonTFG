// Pantalla de detalle de una canción.
// Muestra la portada, el título, el artista, el álbum y permite escuchar una muestra.
// También se pueden ver los comentarios de la canción y navegar al álbum o al artista.

import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { Audio } from 'expo-av';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import CommentsSection from '../Components/ComentsSection';

export default function MusicDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  // Recibimos la canción seleccionada por parámetros
  const { track } = route.params;

  // Estado para saber si la muestra está sonando
  const [isPlaying, setIsPlaying] = useState(false);
  // Estado para los detalles del álbum (se cargan aparte)
  const [albumDetails, setAlbumDetails] = useState(null);
  // Referencia al objeto de sonido para poder pausarlo o pararlo
  const soundRef = useRef(null);

  // Función para cargar los detalles del álbum desde Deezer
  const fetchAlbumDetails = async () => {
    try {
      // Usamos un proxy para evitar CORS
      const url = `https://proxy-media-horizon.vercel.app/api/proxy?url=https://api.deezer.com/album/${track.album.id}`;
      const response = await fetch(url);
      const data = await response.json();
      setAlbumDetails(data);
    } catch (error) {
      console.error("Error fetching album details:", error);
    }
  };

  // Función para reproducir o pausar la muestra de la canción
  const playPreview = async () => {
    if (!track.preview) return;

    if (isPlaying) {
      // Si ya está sonando, la pausamos
      await soundRef.current.pauseAsync();
      setIsPlaying(false);
    } else {
      // Si no está sonando, la cargamos y la reproducimos
      if (!soundRef.current) {
        const { sound } = await Audio.Sound.createAsync({ uri: track.preview });
        soundRef.current = sound;
      }
      await soundRef.current.playAsync();
      setIsPlaying(true);
    }
  };

  // Cuando se monta la pantalla, ponemos el título y cargamos el álbum
  useEffect(() => {
    navigation.setOptions({ title: track.title });
    fetchAlbumDetails(); // Obtener detalles del álbum cuando la pantalla se monta

    // Cuando se desmonta, descargamos el sonido para liberar memoria
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  return (
    <LinearGradient colors={['#fafafa', '#f0f0ff']} style={styles.gradient}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Imagen de la portada del álbum */}
        <Image
          source={{ uri: track.album.cover_big }}
          style={styles.image}
          resizeMode="cover"
        />

        {/* Título de la canción */}
        <Text style={styles.title}>{track.title}</Text>

        {/* Nombre y foto del artista, se puede pulsar para ver más */}
        <TouchableOpacity
          onPress={() => navigation.navigate('DetallesArtista', { artistId: track.artist.id })}
          style={styles.artistContainer}
        >
          {track.artist.picture_medium && (
            <Image source={{ uri: track.artist.picture_medium }} style={styles.artistImage} />
          )}
          <Text style={styles.artistName}>{track.artist.name}</Text>
        </TouchableOpacity>

        {/* Nombre del álbum y duración de la muestra */}
        <Text style={styles.album}>Álbum: <Text style={styles.albumTitle}>{track.album.title}</Text></Text>
        <Text style={styles.duration}>Duración de la muestra: 30 segundos</Text>

        {/* Botón para escuchar o pausar la muestra */}
        {track.preview ? (
          <TouchableOpacity style={styles.button} onPress={playPreview}>
            <Text style={styles.buttonText}>
              {isPlaying ? 'Pausar muestra' : 'Escuchar muestra'}
            </Text>
          </TouchableOpacity>
        ) : (
          <Text style={styles.noPreview}>No hay muestra disponible para esta canción.</Text>
        )}

        {/* Más detalles del álbum si están cargados */}
        {albumDetails && (
          <>
            <Text style={styles.albumDescription}>Género: {albumDetails.genres.data[0].name}</Text>
            <Text style={styles.albumDescription}>Año: {albumDetails.release_date}</Text>
            <Text style={styles.albumDescription}>Duración total: {albumDetails.duration} segundos</Text>

            {/* Botón para ver todas las canciones del álbum */}
            <TouchableOpacity
              style={styles.button}
              onPress={() => navigation.navigate('DetallesÁlbum', { albumId: track.album.id })}
            >
              <Text style={styles.buttonText}>Ver todas las canciones del álbum</Text>
            </TouchableOpacity>
          </>
        )}

        {/* Sección de comentarios para la canción */}
        <View style={styles.infoContainer}>
          <CommentsSection itemType="music" itemId={track.id.toString()} />
        </View>
      </ScrollView>

      {/* Botón para volver atrás */}
      <TouchableOpacity style={{ position: 'absolute', top: 40, left: 16, zIndex: 10 }} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={28} color="#6366F1" />
      </TouchableOpacity>
    </LinearGradient>
  );
}

// Los estilos están abajo y tienen nombres descriptivos para cada parte de la pantalla
const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    alignItems: 'center',
    padding: 24,
  },
  image: {
    width: '85%',
    maxWidth: 400, // Tamaño máximo en píxeles
    aspectRatio: 1, // Mantiene la proporción
    borderRadius: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 12,
  },
  artistContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  artistImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  artistName: {
    fontSize: 18,
    color: '#4B5563',
    fontWeight: '600',
  },
  album: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 4,
  },
  albumTitle: {
    color: '#374151',
    fontWeight: '500',
  },
  duration: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#6366F1',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginTop: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  noPreview: {
    fontSize: 14,
    color: '#EF4444',
    textAlign: 'center',
    marginTop: 24,
  },
  albumDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  username: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  infoContainer: {
    marginTop: 24,
    width: '100%',
    paddingHorizontal: 16,
  },
});
