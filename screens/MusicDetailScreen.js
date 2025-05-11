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

export default function MusicDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { track } = route.params;

  const [isPlaying, setIsPlaying] = useState(false);
  const [albumDetails, setAlbumDetails] = useState(null);
  const soundRef = useRef(null);

  // Cargar detalles del álbum desde Deezer
  const fetchAlbumDetails = async () => {
    try {
      const proxyUrl = 'https://cors-anywhere.herokuapp.com/';
      const url = `${proxyUrl}https://api.deezer.com/album/${track.album.id}`;
      const response = await fetch(url);
      const data = await response.json();
      setAlbumDetails(data);
    } catch (error) {
      console.error("Error fetching album details:", error);
    }
  };

  const playPreview = async () => {
    if (!track.preview) return;

    if (isPlaying) {
      await soundRef.current.pauseAsync();
      setIsPlaying(false);
    } else {
      if (!soundRef.current) {
        const { sound } = await Audio.Sound.createAsync({ uri: track.preview });
        soundRef.current = sound;
      }
      await soundRef.current.playAsync();
      setIsPlaying(true);
    }
  };

  useEffect(() => {
    navigation.setOptions({ title: track.title });
    fetchAlbumDetails(); // Obtener detalles del álbum cuando la pantalla se monta

    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  return (
    <LinearGradient colors={['#fafafa', '#f0f0ff']} style={styles.gradient}>
      <ScrollView contentContainerStyle={styles.container}>
        <Image
          source={{ uri: track.album.cover_big }}
          style={styles.image}
          resizeMode="cover"
        />

        <Text style={styles.title}>{track.title}</Text>

        <TouchableOpacity
          onPress={() => navigation.navigate('DetallesArtista', { artistId: track.artist.id })}
          style={styles.artistContainer}
        >
          {track.artist.picture_medium && (
            <Image source={{ uri: track.artist.picture_medium }} style={styles.artistImage} />
          )}
          <Text style={styles.artistName}>{track.artist.name}</Text>
        </TouchableOpacity>

        <Text style={styles.album}>Álbum: <Text style={styles.albumTitle}>{track.album.title}</Text></Text>
        <Text style={styles.duration}>Duración de la muestra: 30 segundos</Text>

        {track.preview ? (
          <TouchableOpacity style={styles.button} onPress={playPreview}>
            <Text style={styles.buttonText}>
              {isPlaying ? 'Pausar muestra' : 'Escuchar muestra'}
            </Text>
          </TouchableOpacity>
        ) : (
          <Text style={styles.noPreview}>No hay muestra disponible para esta canción.</Text>
        )}

        {albumDetails && (
          <>
            <Text style={styles.albumDescription}>Género: {albumDetails.genres.data[0].name}</Text>
            <Text style={styles.albumDescription}>Año: {albumDetails.release_date}</Text>
            <Text style={styles.albumDescription}>Duración total: {albumDetails.duration} segundos</Text>

            <TouchableOpacity
              style={styles.button}
              onPress={() => navigation.navigate('DetallesÁlbum', { albumId: track.album.id })}
            >
              <Text style={styles.buttonText}>Ver todas las canciones del álbum</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

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
});
