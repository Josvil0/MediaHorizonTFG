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

export default function MusicSearchScreen() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();

  const searchMusic = async () => {
    if (!query.trim()) {
      console.error('El término de búsqueda está vacío');
      return;
    }

    setLoading(true);

    try {
      // Usar proxy público para evitar problemas de CORS
      const proxyUrl = 'https://cors-anywhere.herokuapp.com/';
      const url = `${proxyUrl}https://api.deezer.com/search?q=${encodeURIComponent(query)}`;

      const res = await fetch(url);

      if (!res.ok) {
        throw new Error(`Error en la solicitud: ${res.status} ${res.statusText}`);
      }

      const data = await res.json();

      if (data && data.data) {
        setResults(data.data);
      } else {
        console.error('No se recibieron datos válidos:', data);
        setResults([]);
      }
    } catch (err) {
      console.error('Error buscando en Deezer:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>

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

      {loading && <ActivityIndicator size="large" color="#6366F1" style={{ marginVertical: 20 }} />}

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
