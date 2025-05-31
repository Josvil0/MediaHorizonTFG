// Pantalla para buscar canciones y artistas usando la API de Deezer (a través de un proxy).
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
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

export default function MusicSearchScreen() {
  // Estado para el texto de búsqueda
  const [query, setQuery] = useState('');
  // Estado para los resultados de la búsqueda
  const [results, setResults] = useState([]);
  // Estado para saber si está cargando
  const [loading, setLoading] = useState(false);
  // Hook para navegar entre pantallas
  const navigation = useNavigation();

  // Función para buscar música en Deezer usando un proxy (por CORS)
  const searchMusic = async () => {
    if (!query.trim()) return; // Si no hay texto, no busca

    setLoading(true); // Muestra el spinner de carga
    try {
      // Llama al proxy que a su vez llama a la API de Deezer
      const url = `https://proxy-media-horizon.vercel.app/api/proxy?url=https://api.deezer.com/search?q=${encodeURIComponent(query)}`;
      const res = await fetch(url);
      const data = await res.json();
      console.log('Respuesta del proxy:', data); // Para depurar la respuesta

      if (data && data.data) {
        setResults(data.data); // Guarda los resultados de Deezer
      } else {
        setResults([]); // Si no hay resultados, deja la lista vacía
      }
    } catch (err) {
      console.error('Error en fetch:', err); // Muestra el error en consola
      setResults([]); // Si hay error, deja la lista vacía
    } finally {
      setLoading(false); // Oculta el spinner
    }
  };

  return (
    <View style={styles.container}>
      {/* Encabezado con botones para cambiar de sección */}
      <View style={styles.headerContainer}>
        <TouchableOpacity
          onPress={() => navigation.navigate('Inicio')}
          style={styles.headerButton}
        >
          <Text style={styles.headerButtonText}>📚 Libros</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => navigation.navigate('BuscarPelículas')}
          style={styles.headerButton}
        >
          <Text style={styles.headerButtonText}>🎬 Películas</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => navigation.navigate('BuscarMúsica')}
          style={[styles.headerButton, styles.activeHeaderButton]}
        >
          <Text style={[styles.headerButtonText, styles.activeHeaderButtonText]}>🎵 Música</Text>
        </TouchableOpacity>
      </View>

      {/* Barra de búsqueda de música */}
      <View style={styles.searchBar}>
        <TextInput
          placeholder="Buscar canciones, artistas..."
          placeholderTextColor="#9CA3AF"
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={searchMusic}
          style={styles.input}
        />
        <TouchableOpacity onPress={searchMusic} style={styles.searchButton}>
          <Text style={styles.searchButtonText}>Buscar</Text>
        </TouchableOpacity>
      </View>

      {/* Spinner de carga mientras busca */}
      {loading && <ActivityIndicator size="large" color="#6366F1" style={{ marginVertical: 20 }} />}

      {/* Lista de resultados de canciones */}
      <FlatList
        data={results}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => navigation.navigate('DetalleMúsica', { track: item })}
            style={styles.card}
          >
            <Image source={{ uri: item.album.cover_medium }} style={styles.image} />
            <View style={styles.info}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.artist}>{item.artist.name}</Text>
              <Text style={styles.album}>{item.album.title}</Text>
            </View>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB', padding: 16 },
  header: { fontSize: 24, fontWeight: 'bold', color: '#111827', textAlign: 'center', marginBottom: 16 },
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
  image: { width: 100, height: 100 },
  info: { flex: 1, padding: 12, justifyContent: 'center' },
  title: { fontSize: 16, fontWeight: 'bold', color: '#111827' },
  artist: { fontSize: 14, color: '#6B7280' },
  album: { fontSize: 13, color: '#9CA3AF' },
});
