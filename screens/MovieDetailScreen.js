import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
} from 'react-native';

const API_KEY = '38d68f606cbdd06f61403a6c6e40a548';

export default function MovieDetailScreen({ route, navigation }) {
  const { movie } = route.params;
  const [similarMovies, setSimilarMovies] = useState([]);
  const [loadingSimilar, setLoadingSimilar] = useState(true);

  const fetchSimilarMovies = async () => {
    const endpoint = movie.media_type === 'movie'
      ? `https://api.themoviedb.org/3/movie/${movie.id}/recommendations`
      : `https://api.themoviedb.org/3/tv/${movie.id}/recommendations`;

    try {
      const res = await fetch(`${endpoint}?api_key=${API_KEY}&language=es-ES`);
      const data = await res.json();
      setSimilarMovies(data.results || []);
    } catch (error) {
      console.error('Error fetching recommended movies:', error);
    } finally {
      setLoadingSimilar(false);
    }
  };

  useEffect(() => {
    fetchSimilarMovies();
  }, []);

  const imageUrl = movie.poster_path
    ? `https://image.tmdb.org/t/p/w780${movie.poster_path}`
    : 'https://cdn-icons-png.flaticon.com/512/4076/4076549.png';

  return (
    <ScrollView style={styles.container}>
      <View style={styles.imageContainer}>
        <Image source={{ uri: imageUrl }} style={styles.image} />
      </View>
      <View style={styles.infoContainer}>
        <Text style={styles.title}>{movie.title || movie.name || 'Sin título'}</Text>
        <Text style={styles.subtitle}>
          {movie.release_date || movie.first_air_date || 'Fecha desconocida'}
        </Text>
        <Text style={styles.description}>{movie.overview || 'Sin descripción disponible.'}</Text>

        {movie.homepage && (
          <TouchableOpacity
            style={styles.button}
            onPress={() => Linking.openURL(movie.homepage)}
          >
            <Text style={styles.buttonText}>Ver más</Text>
          </TouchableOpacity>
        )}

        <Text style={styles.sectionTitle}>Recomendaciones</Text>
        {loadingSimilar ? (
          <ActivityIndicator size="large" color="#6366F1" />
        ) : similarMovies.length > 0 ? (
          <FlatList
            data={similarMovies}
            keyExtractor={(item) => item.id.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.card}
                onPress={() => navigation.push('DetallePelícula', { movie: item })}
              >
                <Image
                  source={{
                    uri: item.poster_path
                      ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
                      : 'https://cdn-icons-png.flaticon.com/512/4076/4076549.png',
                  }}
                  style={styles.cardImage}
                />
                <Text style={styles.cardTitle} numberOfLines={2}>
                  {item.title || item.name || 'Sin título'}
                </Text>
              </TouchableOpacity>
            )}
          />
        ) : (
          <Text style={styles.noSimilarText}>No se encontraron recomendaciones.</Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  imageContainer: {
    alignItems: 'center',
    marginVertical: 16,
    backgroundColor: '#E5E7EB', // Fondo gris claro detrás del póster
    borderRadius: 16,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5, // Sombra para Android
  },
  image: {
    width: '80%', // Más grande, ocupa el 80% del contenedor
    height: 300, // Altura ajustada
    resizeMode: 'contain', // Asegura que la imagen no se corte
    borderRadius: 12, // Bordes redondeados
  },
  infoContainer: { padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#111827', marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#6B7280', marginBottom: 16, textAlign: 'center' },
  description: { fontSize: 14, color: '#374151', marginBottom: 16, lineHeight: 20, textAlign: 'justify' },
  button: {
    backgroundColor: '#6366F1',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonText: { color: '#fff', fontWeight: 'bold' },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#111827', marginBottom: 8 },
  card: { marginRight: 16, width: 120 },
  cardImage: { width: 120, height: 180, borderRadius: 8, marginBottom: 8 },
  cardTitle: { fontSize: 12, color: '#374151', textAlign: 'center' },
  noSimilarText: { fontSize: 14, color: '#6B7280', textAlign: 'center', marginTop: 16 },
});