// Pantalla principal para buscar libros usando la API de Google Books.
// El usuario puede escribir el título de un libro y ver los resultados.
// También puede navegar a buscar películas o música desde aquí.

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
import { Ionicons } from '@expo/vector-icons';

export default function HomeScreen({ navigation }) {
  // Estado para el texto de búsqueda
  const [query, setQuery] = useState('');
  // Estado para los resultados de la búsqueda
  const [results, setResults] = useState([]);
  // Estado para saber si está cargando
  const [loading, setLoading] = useState(false);

  // Función para buscar libros en la API de Google Books
  const searchBooks = async () => {
    if (!query.trim()) return; // Si no hay texto, no busca
    setLoading(true); // Muestra el spinner de carga
    try {
      // Llama a la API de Google Books con el texto de búsqueda
      const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${query}`);
      const data = await res.json();
      setResults(data.items || []); // Guarda los resultados
    } catch (error) {
      console.error('Error fetching books:', error);
    } finally {
      setLoading(false); // Oculta el spinner
    }
  };

  return (
    <View style={styles.container}>
      {/* Barra superior con los botones para cambiar de sección */}
      <View style={styles.headerContainer}>
        <TouchableOpacity
          onPress={() => navigation.navigate('Inicio')}
          style={[styles.headerButton, styles.activeHeaderButton]}
        >
          <Text style={[styles.headerButtonText, styles.activeHeaderButtonText]}>📚 Libros</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => navigation.navigate('BuscarPelículas')}
          style={styles.headerButton}
        >
          <Text style={styles.headerButtonText}>🎬 Películas</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => navigation.navigate('BuscarMúsica')}
          style={styles.headerButton}
        >
          <Text style={styles.headerButtonText}>🎵 Música</Text>
        </TouchableOpacity>
      </View>

      {/* Barra de búsqueda de libros */}
      <View style={styles.searchBar}>
        <TextInput
          placeholder="Buscar libros..."
          placeholderTextColor="#9CA3AF"
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={searchBooks}
          style={styles.input}
        />
        <TouchableOpacity onPress={searchBooks} style={styles.searchButton}>
          <Text style={styles.searchButtonText}>Buscar</Text>
        </TouchableOpacity>
      </View>

      {/* Spinner de carga mientras busca */}
      {loading && <ActivityIndicator size="large" color="#6366F1" style={{ marginVertical: 20 }} />}

      {/* Lista de resultados de libros */}
      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          // Cogemos la info del libro
          const book = item.volumeInfo;
          // Buscamos la imagen del libro, si no hay ponemos una por defecto
          let imageUrl = book.imageLinks?.smallThumbnail || book.imageLinks?.thumbnail;
          imageUrl = imageUrl
            ? imageUrl.replace(/^http:\/\//i, 'https://')
            : 'https://cdn-icons-png.flaticon.com/512/29/29302.png'; // Placeholder

          return (
            <TouchableOpacity
              onPress={() =>
                navigation.navigate('DetalleLibro', {
                  book: { ...book, id: item.id } // Pasamos los datos del libro a la siguiente pantalla
                })
              }
              style={styles.card}
            >
              <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />
              <View style={styles.info}>
                <Text numberOfLines={2} style={styles.bookTitle}>{book.title}</Text>
                <Text style={styles.bookAuthor}>{book.authors?.join(', ') || 'Autor desconocido'}</Text>
                {book.publishedDate && (
                  <Text style={styles.bookDate}>Publicado: {book.publishedDate}</Text>
                )}
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

// Los estilos están abajo y tienen nombres descriptivos para cada parte de la pantalla
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    padding: 16,
  },
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
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  input: {
    flex: 1,
    color: '#111827',
    fontSize: 16,
  },
  searchButton: {
    backgroundColor: '#6366F1',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginLeft: 8,
  },
  searchButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  list: {
    paddingBottom: 24,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  image: {
    width: 110,
    height: 160,
  },
  info: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
  },
  bookTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  bookAuthor: {
    fontSize: 14,
    color: '#6B7280',
  },
  bookDate: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
});
