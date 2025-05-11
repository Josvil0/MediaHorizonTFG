import React, { useState } from 'react';
import {
  View,
  TextInput,
  FlatList,
  Text,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';

const TMDB_ACCESS_TOKEN = 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIzOGQ2OGY2MDZjYmRkMDZmNjE0MDNhNmM2ZTQwYTU0OCIsInN1YiI6IjY3NTM0ZmQ2ODAyYmFkMTYwOTFhYzU1NiIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.ZnqOLJwRFS_AfVj28xAYqw4rfJK7omTi7wLWYJn3ROw';

export default function MovieSearchScreen({ navigation }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const searchMoviesAndSeries = async () => {
    if (!query.trim()) {
      console.error('El término de búsqueda está vacío');
      return;
    }

    setLoading(true);
    try {
      const url = `https://api.themoviedb.org/3/search/multi?query=${encodeURIComponent(query)}&language=es-ES&api_key=38d68f606cbdd06f61403a6c6e40a548`;

      const res = await fetch(url);
      const data = await res.json();

      if (res.ok) {
        setResults(data.results || []);
      } else {
        console.error('Error en la respuesta de TMDb:', data);
      }
    } catch (error) {
      console.error('Error fetching TMDb content:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Encabezado con botones */}
      <View style={styles.headerContainer}>
        <TouchableOpacity
          onPress={() => navigation.navigate('Inicio')}
          style={styles.headerButton}
        >
          <Text style={styles.headerButtonText}>📚 Libros</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => navigation.navigate('BuscarPelículas')}
          style={[styles.headerButton, styles.activeHeaderButton]}
        >
          <Text style={[styles.headerButtonText, styles.activeHeaderButtonText]}>🎬 Películas</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => navigation.navigate('BuscarMúsica')}
          style={styles.headerButton}
        >
          <Text style={styles.headerButtonText}>🎵 Música</Text>
        </TouchableOpacity>
      </View>

      {/* Barra de búsqueda de películas */}
      <View style={styles.searchBar}>
        <TextInput
          placeholder="Buscar en TMDb..."
          placeholderTextColor="#9CA3AF"
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={searchMoviesAndSeries}
          style={styles.input}
        />
        <TouchableOpacity onPress={searchMoviesAndSeries} style={styles.searchButton}>
          <Text style={styles.searchButtonText}>Buscar</Text>
        </TouchableOpacity>
      </View>

      {loading && <ActivityIndicator size="large" color="#6366F1" style={{ marginVertical: 20 }} />}

      {results.length === 0 && !loading && (
        <Text style={{ textAlign: 'center', color: '#6B7280', marginTop: 20 }}>
          No se encontraron resultados.
        </Text>
      )}

      <FlatList
        data={results}
        keyExtractor={(item) => item.id?.toString()}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const title = item.title || item.name || 'Sin título';
          const overview = item.overview || 'Sin descripción';
          const imageUrl = item.poster_path
            ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
            : 'https://cdn-icons-png.flaticon.com/512/4076/4076549.png';

          return (
            <TouchableOpacity
              style={styles.card}
              onPress={() => navigation.navigate('DetallePelícula', { movie: item })}
            >
              <Image source={{ uri: imageUrl }} style={styles.image} />
              <View style={styles.info}>
                <Text numberOfLines={2} style={styles.title}>{title}</Text>
                <Text numberOfLines={3} style={styles.overview}>{overview}</Text>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB', padding: 16 },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 8,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  headerButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeHeaderButton: {
    backgroundColor: '#6366F1',
  },
  headerButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6B7280',
  },
  activeHeaderButtonText: {
    color: '#FFFFFF',
  },
  searchBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
    marginBottom: 16,
    elevation: 2,
  },
  input: { flex: 1, fontSize: 16, color: '#111827' },
  searchButton: {
    backgroundColor: '#6366F1',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginLeft: 8,
  },
  searchButtonText: { color: '#fff', fontWeight: 'bold' },
  list: { paddingBottom: 24 },
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    elevation: 1,
  },
  image: { width: 100, height: 150 },
  info: { flex: 1, padding: 12, justifyContent: 'center' },
  title: { fontSize: 16, fontWeight: 'bold', color: '#111827', marginBottom: 4 },
  overview: { fontSize: 14, color: '#6B7280' },
});
