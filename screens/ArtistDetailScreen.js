import React, { useEffect, useState } from 'react';
import { View, Text, Image, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function ArtistDetailsScreen({ route, navigation }) {
  const { artistId } = route.params;
  const [artist, setArtist] = useState(null);
  const [topTracks, setTopTracks] = useState([]);

  useEffect(() => {
    const fetchArtistDetails = async () => {
      try {
        const proxyUrl = 'https://cors-anywhere.herokuapp.com/';
        const artistUrl = `${proxyUrl}https://api.deezer.com/artist/${artistId}`;
        const topTracksUrl = `${proxyUrl}https://api.deezer.com/artist/${artistId}/top`;

        const [artistResponse, topTracksResponse] = await Promise.all([
          fetch(artistUrl),
          fetch(topTracksUrl),
        ]);

        const artistData = await artistResponse.json();
        const topTracksData = await topTracksResponse.json();

        setArtist(artistData);
        setTopTracks(topTracksData.data);
      } catch (error) {
        console.error('Error fetching artist details:', error);
      }
    };

    fetchArtistDetails();
  }, [artistId]);

  return (
    <LinearGradient colors={['#fafafa', '#f0f0ff']} style={styles.gradient}>
      <View style={styles.container}>
        {artist ? (
          <>
            <Image source={{ uri: artist.picture_big }} style={styles.image} />
            <Text style={styles.name}>{artist.name}</Text>
            <Text style={styles.info}>Fans: {artist.nb_fan.toLocaleString()}</Text>

            <Text style={styles.sectionTitle}>Top canciones</Text>
            <FlatList
              data={topTracks}
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
        ) : (
          <Text style={styles.loadingText}>Cargando información del artista...</Text>
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
});