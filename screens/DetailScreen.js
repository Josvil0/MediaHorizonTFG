import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  Pressable,
  FlatList,
  Dimensions,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';

export default function DetailScreen({ route }) {
  const { book } = route.params;
  const [relatedBooks, setRelatedBooks] = useState([]);
  const [loadingRelated, setLoadingRelated] = useState(true);
  const navigation = useNavigation();
  const width = Dimensions.get('window').width;

  const getImageUrl = (book) => {
    if (!book) return require('../assets/placeholder.png');

    const imageLinks = book.imageLinks || book.volumeInfo?.imageLinks;
    if (imageLinks) {
      const url =
        imageLinks.extraLarge ||
        imageLinks.large ||
        imageLinks.medium ||
        imageLinks.thumbnail ||
        imageLinks.smallThumbnail;

      if (url) {
        const httpsUrl = url.replace(/^http:/, 'https:');
        return { uri: httpsUrl };
      }
    }

    return require('../assets/placeholder.png');
  };

  const imageUrl = getImageUrl(book);

  useEffect(() => {
    const author = book.authors?.[0];
    if (author) {
      fetch(`https://www.googleapis.com/books/v1/volumes?q=inauthor:"${author}"`)
        .then((res) => res.json())
        .then((data) => {
          const books = data.items?.filter((b) => b.id !== book.id).slice(0, 10);
          setRelatedBooks(books || []);
        })
        .catch((err) => console.error('Error al cargar libros relacionados:', err))
        .finally(() => setLoadingRelated(false));
    } else {
      setLoadingRelated(false);
    }
  }, []);

  return (
    <LinearGradient colors={['#f8f4ff', '#e6f7ff']} style={styles.gradient}>
      <ScrollView contentContainerStyle={styles.container}>
      <Image
  source={imageUrl}
  style={[
    styles.image,
    {
      width: Math.min(width * 0.5, 250),
      height: Math.min(width * 0.75, 375),
    },
  ]}
/>


        <Text style={styles.title}>{book.title}</Text>
        <Text style={styles.author}>{book.authors?.join(', ') || 'Autor desconocido'}</Text>

        {book.previewLink && (
          <Pressable style={styles.button} onPress={() => Linking.openURL(book.previewLink)}>
            <Text style={styles.buttonText}>Vista previa</Text>
          </Pressable>
        )}

        <Text style={styles.description}>
          {book.description ? book.description.replace(/<[^>]+>/g, '') : 'Sin descripción disponible.'}
        </Text>

        {/* Libros relacionados */}
        <Text style={styles.sectionTitle}>Más libros del autor</Text>

        {loadingRelated ? (
          <ActivityIndicator size="large" color="#7b2cbf" style={{ marginBottom: 20 }} />
        ) : relatedBooks.length > 0 ? (
          <FlatList
            data={relatedBooks}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.relatedList}
            renderItem={({ item }) => {
              return (
                <Pressable
                  style={styles.relatedCard}
                  onPress={() => {
                    const relatedBook = {
                      ...item.volumeInfo,
                      id: item.id, // Incluye el ID del libro
                    };
                    navigation.push('DetalleLibro', { book: relatedBook });
                  }}
                >
                  <Image
                    source={getImageUrl(item)}
                    style={styles.relatedImage}
                    onError={(e) => {
                      console.error('Error al cargar la imagen relacionada:', e.nativeEvent.error);
                    }}
                  />
                  <Text style={styles.relatedTitle} numberOfLines={2}>
                    {item.volumeInfo?.title || 'Título desconocido'}
                  </Text>
                </Pressable>
              );
            }}
          />
        ) : (
          <Text style={{ color: '#888', fontStyle: 'italic', marginBottom: 20 }}>No se encontraron más libros.</Text>
        )}

        {/* Reseñas */}
        <Text style={styles.sectionTitle}>Reseñas</Text>
        <View style={styles.reviewCard}>
          <Text style={styles.reviewText}>
            "Una obra impresionante que me atrapó desde el primer capítulo."
          </Text>
          <Text style={styles.reviewAuthor}>— Usuario anónimo</Text>
        </View>
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
    padding: 20,
  },
  image: {
    borderRadius: 12,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 6,
    color: '#333',
  },
  author: {
    fontSize: 16,
    color: '#777',
    marginBottom: 20,
    fontStyle: 'italic',
  },
  button: {
    backgroundColor: '#7b2cbf',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 20,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
  description: {
    fontSize: 15,
    color: '#555',
    textAlign: 'justify',
    lineHeight: 22,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    alignSelf: 'flex-start',
    marginBottom: 10,
    color: '#222',
  },
  relatedList: {
    paddingBottom: 20,
  },
  relatedCard: {
    marginRight: 16,
    alignItems: 'center',
    width: 80,
  },
  relatedImage: {
    width: 80,
    height: 120,
    borderRadius: 8,
    marginBottom: 6,
  },
  relatedTitle: {
    fontSize: 12,
    textAlign: 'center',
    color: '#444',
  },
  reviewCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginTop: 10,
    width: '100%',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  reviewText: {
    fontSize: 14,
    marginBottom: 8,
    color: '#333',
  },
  reviewAuthor: {
    fontSize: 12,
    color: '#777',
    textAlign: 'right',
  },
});
