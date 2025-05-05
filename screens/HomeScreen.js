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

export default function HomeScreen({ navigation }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const searchBooks = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${query}`);
      const data = await res.json();
      setResults(data.items || []);
    } catch (error) {
      console.error('Error fetching books:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>📚 MediaHorizon</Text>

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

      {loading && <ActivityIndicator size="large" color="#6366F1" style={{ marginVertical: 20 }} />}

      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const book = item.volumeInfo;

          // Corrección del problema: forzar HTTPS y fallback
          let imageUrl = book.imageLinks?.smallThumbnail || book.imageLinks?.thumbnail;

          if (imageUrl) {
            imageUrl = imageUrl.replace(/^http:\/\//i, 'https://');
          } else {
            imageUrl = 'https://cdn-icons-png.flaticon.com/512/29/29302.png'; // Placeholder
          }


          return (
            <TouchableOpacity
              onPress={() => navigation.navigate('Detalle', { book })}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    padding: 16,
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 20,
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
