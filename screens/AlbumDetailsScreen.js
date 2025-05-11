import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function AlbumDetailsScreen({ route, navigation }) {
  const { albumId } = route.params;
  const [album, setAlbum] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAlbumDetails = async () => {
      try {
        const proxyUrl = 'https://cors-anywhere.herokuapp.com/';
        const url = `${proxyUrl}https://api.deezer.com/album/${albumId}`;
        const response = await fetch(url);
        const data = await response.json();
        setAlbum(data);
        setTracks(data.tracks.data);
      } catch (error) {
        console.error('Error fetching album details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAlbumDetails();
  }, [albumId]);

  return (
    <LinearGradient colors={['#fafafa', '#f0f0ff']} style={styles.gradient}>
      <View style={styles.container}>
        {loading ? (
          <Text style={styles.loadingText}>Cargando canciones...</Text>
        ) : (
          <>
            <Image source={{ uri: album.cover_big }} style={styles.image} />
            <Text style={styles.title}>{album.title}</Text>
            <Text style={styles.artist}>Por: {album.artist.name}</Text>
            <Text style={styles.info}>Fecha de lanzamiento: {album.release_date}</Text>

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
});