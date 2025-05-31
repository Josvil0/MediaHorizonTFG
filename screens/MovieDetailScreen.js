// Pantalla de detalle de una película o serie.
// Muestra la información principal, la imagen, una descripción y recomendaciones similares.
// También permite ver y escribir comentarios sobre la película.

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
import { Ionicons } from '@expo/vector-icons';
import CommentsSection from '../Components/ComentsSection';

const API_KEY = '38d68f606cbdd06f61403a6c6e40a548';

export default function MovieDetailScreen({ route, navigation }) {
  // Recibimos la película por parámetros de navegación
  const { movie } = route.params;
  // Estado para las películas similares
  const [similarMovies, setSimilarMovies] = useState([]);
  // Estado para saber si está cargando las recomendaciones
  const [loadingSimilar, setLoadingSimilar] = useState(true);

  // Función para buscar películas o series similares usando la API de TMDB
  const fetchSimilarMovies = async () => {
    // Dependiendo si es película o serie, cambia el endpoint
    const endpoint = movie.media_type === 'movie'
      ? `https://api.themoviedb.org/3/movie/${movie.id}/recommendations`
      : `https://api.themoviedb.org/3/tv/${movie.id}/recommendations`;

    try {
      // Llama a la API de TMDB para obtener recomendaciones
      const res = await fetch(`${endpoint}?api_key=${API_KEY}&language=es-ES`);
      const data = await res.json();
      setSimilarMovies(data.results || []);
    } catch (error) {
      console.error('Error fetching recommended movies:', error);
    } finally {
      setLoadingSimilar(false);
    }
  };

  // Al montar la pantalla, busca las recomendaciones
  useEffect(() => {
    fetchSimilarMovies();
  }, []);

  // Prepara la URL de la imagen del póster
  const imageUrl = movie.poster_path
    ? `https://image.tmdb.org/t/p/w780${movie.poster_path}`
    : 'https://cdn-icons-png.flaticon.com/512/4076/4076549.png';

  return (
    <ScrollView style={styles.container}>
      {/* Imagen principal de la película */}
      <View style={styles.imageContainer}>
        <Image source={{ uri: imageUrl }} style={styles.image} />
      </View>
      <View style={styles.infoContainer}>
        {/* Título y fecha */}
        <Text style={styles.title}>{movie.title || movie.name || 'Sin título'}</Text>
        <Text style={styles.subtitle}>
          {movie.release_date || movie.first_air_date || 'Fecha desconocida'}
        </Text>
        {/* Descripción */}
        <Text style={styles.description}>{movie.overview || 'Sin descripción disponible.'}</Text>

        {/* Botón para ir a la web oficial si existe */}
        {movie.homepage && (
          <TouchableOpacity
            style={styles.button}
            onPress={() => Linking.openURL(movie.homepage)}
          >
            <Text style={styles.buttonText}>Ver más</Text>
          </TouchableOpacity>
        )}

        {/* Sección de recomendaciones */}
        <Text style={styles.sectionTitle}>Recomendaciones</Text>
        {loadingSimilar ? (
          // Muestra spinner mientras carga
          <ActivityIndicator size="large" color="#6366F1" />
        ) : similarMovies.length > 0 ? (
          // Lista horizontal de películas similares
          <FlatList
            data={similarMovies}
            keyExtractor={(item) => item.id.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToAlignment="start"
            decelerationRate="fast"
            snapToInterval={128} // Ajusta según el ancho de tu card
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.card}
                onPress={() => navigation.push('DetallePelícula', { movie: item })}
              >
                {/* Imagen del póster o icono si no hay */}
                {item.poster_path ? (
                  <Image
                    source={{ uri: `https://image.tmdb.org/t/p/w500${item.poster_path}` }}
                    style={styles.cardImage}
                  />
                ) : (
                  <View style={[styles.cardImage, { backgroundColor: '#e5e7eb', alignItems: 'center', justifyContent: 'center' }]}>
                    <Ionicons name="film-outline" size={40} color="#6366F1" />
                  </View>
                )}
                <Text style={styles.cardTitle} numberOfLines={2}>
                  {item.title || item.name || 'Sin título'}
                </Text>
              </TouchableOpacity>
            )}
          />
        ) : (
          // Si no hay recomendaciones
          <Text style={styles.noSimilarText}>No se encontraron recomendaciones.</Text>
        )}

        {/* Sección de comentarios para la película */}
        <CommentsSection itemType="movie" itemId={movie.id.toString()} />
      </View>
      {/* Botón para volver atrás */}
      <TouchableOpacity style={{ position: 'absolute', top: 40, left: 16, zIndex: 10 }} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={28} color="#6366F1" />
      </TouchableOpacity>
    </ScrollView>
  );
}

// Los estilos están abajo y tienen nombres descriptivos para cada parte de la pantalla
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