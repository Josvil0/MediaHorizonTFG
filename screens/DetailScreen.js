import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  FlatList,
  Pressable,
  ActivityIndicator,
  Dimensions,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CommentsSection from '../Components/ComentsSection';

export default function DetailScreen({ route, navigation }) {
  // Obtenemos el libro pasado por parámetros de la navegación
  const { book } = route.params;

  // Estado para almacenar libros relacionados
  const [relatedBooks, setRelatedBooks] = useState([]);
  // Estado para controlar el indicador de carga de los libros relacionados
  const [loadingRelated, setLoadingRelated] = useState(true);

  // Obtener el ancho de la pantalla para ajustar tamaños responsivos
  const width = Dimensions.get('window').width;

  // Función para obtener la URL de la imagen del libro
  // Si no existe imagen, devuelve un placeholder local
  const getImageUrl = (book) => {
    if (!book) return require('../assets/placeholder.png'); // Placeholder si no hay libro
    // Intentamos obtener las imágenes desde las propiedades posibles
    const imageLinks = book.imageLinks || book.volumeInfo?.imageLinks;
    if (imageLinks) {
      // Prioridad para las imágenes más grandes
      const url =
        imageLinks.extraLarge ||
        imageLinks.large ||
        imageLinks.medium ||
        imageLinks.thumbnail ||
        imageLinks.smallThumbnail;
      if (url) {
        // Aseguramos que el protocolo sea HTTPS
        const httpsUrl = url.replace(/^http:/, 'https:');
        return { uri: httpsUrl };
      }
    }
    // Si no hay imagen disponible, usamos placeholder
    return require('../assets/placeholder.png');
  };

  // Obtenemos la imagen del libro actual
  const imageUrl = getImageUrl(book);

  // useEffect para cargar libros relacionados al autor
  useEffect(() => {
    // Obtenemos el primer autor para hacer la búsqueda
    const author = book.authors?.[0];
    if (author) {
      // Petición a la API de Google Books para buscar libros del mismo autor
      fetch(`https://www.googleapis.com/books/v1/volumes?q=inauthor:"${author}"`)
        .then((res) => res.json()) // Convertimos la respuesta a JSON
        .then((data) => {
          // Filtramos para excluir el libro actual y limitamos a 10 resultados
          const books = data.items?.filter((b) => b.id !== book.id).slice(0, 10);
          setRelatedBooks(books || []); // Guardamos en el estado
        })
        .catch((err) => console.error('Error al cargar libros relacionados:', err))
        .finally(() => setLoadingRelated(false)); // Indicamos que terminó la carga
    } else {
      // Si no hay autor, simplemente indicamos que no hay carga
      setLoadingRelated(false);
    }
  }, []); // Se ejecuta solo una vez al montar el componente

  return (
    <ScrollView style={styles.container}>
      {/* Botón para volver atrás */}
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={28} color="#6366F1" />
      </TouchableOpacity>

      {/* Contenedor de la imagen principal */}
      <View style={styles.imageContainer}>
        <Image
          source={imageUrl}
          style={[
            styles.image,
            {
              // Ajustamos tamaño máximo responsivo para la imagen
              width: Math.min(width * 0.5, 250),
              height: Math.min(width * 0.75, 375),
            },
          ]}
        />
      </View>

      {/* Contenedor con la información del libro */}
      <View style={styles.infoContainer}>
        {/* Título */}
        <Text style={styles.title}>{book.title}</Text>
        {/* Autores o texto por defecto si no hay */}
        <Text style={styles.author}>{book.authors?.join(', ') || 'Autor desconocido'}</Text>

        {/* Botón para abrir la vista previa en navegador */}
        {book.previewLink && (
          <TouchableOpacity style={styles.button} onPress={() => Linking.openURL(book.previewLink)}>
            <Text style={styles.buttonText}>Vista previa</Text>
          </TouchableOpacity>
        )}

        {/* Descripción del libro, limpiando etiquetas HTML */}
        <Text style={styles.description}>
          {book.description ? book.description.replace(/<[^>]+>/g, '') : 'Sin descripción disponible.'}
        </Text>

        {/* Sección para libros relacionados */}
        <Text style={[styles.sectionTitle, { paddingHorizontal: 16 }]}>Más libros del autor</Text>

        {/* Indicador de carga mientras obtenemos libros relacionados */}
        {loadingRelated ? (
          <ActivityIndicator size="large" color="#7b2cbf" style={{ marginBottom: 20 }} />
        ) : relatedBooks.length > 0 ? (
          // Lista horizontal con libros relacionados
          <FlatList
            data={relatedBooks}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToAlignment="start"
            decelerationRate="fast"
            snapToInterval={100}
            contentContainerStyle={[styles.relatedList, { paddingLeft: 16, paddingRight: 16 }]}
            style={{ height: 160, marginBottom: 24 }}
            renderItem={({ item }) => (
              <Pressable
                style={styles.relatedCard}
                onPress={() => {
                  // Al pulsar, navegamos a otro detalle con el libro relacionado
                  const relatedBook = {
                    ...item.volumeInfo,
                    id: item.id,
                  };
                  navigation.push('DetalleLibro', { book: relatedBook });
                }}
              >
                {/* Imagen del libro relacionado o icono placeholder */}
                {item.volumeInfo?.imageLinks?.thumbnail ? (
                  <Image
                    source={{ uri: item.volumeInfo.imageLinks.thumbnail.replace(/^http:/, 'https:') }}
                    style={styles.relatedImage}
                  />
                ) : (
                  <View style={styles.relatedImage}>
                    <Ionicons name="book-outline" size={36} color="#6366F1" />
                  </View>
                )}

                {/* Título del libro relacionado */}
                <Text style={styles.relatedTitle} numberOfLines={2} ellipsizeMode="tail">
                  {item.volumeInfo?.title || 'Título desconocido'}
                </Text>
              </Pressable>
            )}
          />
        ) : (
          // Mensaje si no hay libros relacionados
          <Text style={{ color: '#888', fontStyle: 'italic', marginBottom: 20, paddingHorizontal: 16 }}>
            No se encontraron más libros.
          </Text>
        )}

        {/* Sección de comentarios, pasando tipo e id del libro */}
        <CommentsSection itemType="book" itemId={book.id} />
      </View>
    </ScrollView>
  );
}

// Estilos para la pantalla
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  backButton: { position: 'absolute', top: 40, left: 16, zIndex: 10 },
  imageContainer: {
    alignItems: 'center',
    marginVertical: 16,
    backgroundColor: '#E5E7EB',
    borderRadius: 16,
    padding: 8,
    // Sombra para iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    // Sombra para Android
    elevation: 5,
  },
  image: {
    borderRadius: 12,
    marginBottom: 20,
    width: 180,
    height: 270,
    resizeMode: 'contain',
  },
  infoContainer: {
    padding: 16,
    width: '100%',
    // Nota: NO usar alignItems: 'center' para mantener texto alineado a la izquierda
  },
  title: { fontSize: 24, fontWeight: 'bold', color: '#111827', marginBottom: 8, textAlign: 'center' },
  author: { fontSize: 16, color: '#6B7280', marginBottom: 16, fontStyle: 'italic', textAlign: 'center' },
  button: {
    backgroundColor: '#6366F1',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonText: { color: '#fff', fontWeight: 'bold' },
  description: { fontSize: 14, color: '#374151', marginBottom: 16, lineHeight: 20, textAlign: 'justify' },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#111827', marginBottom: 8 },
  relatedList: { paddingBottom: 20 },
  relatedCard: { marginRight: 16, alignItems: 'center', width: 100 },
  relatedImage: {
    width: 80,
    height: 120,
    borderRadius: 8,
    marginBottom: 6,
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  relatedTitle: { fontSize: 12, textAlign: 'center', color: '#444', width: 90 },
});
