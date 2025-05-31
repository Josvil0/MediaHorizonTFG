// Este componente muestra el feed de la comunidad.
// Aquí se ven todos los posts de los usuarios, con sus comentarios y likes.
// También puedes crear un post nuevo, con imagen o vídeo si quieres.

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  StyleSheet,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import supabase from '../Services/supabaseClient';
import { Ionicons } from '@expo/vector-icons';

// Componente principal del feed
const FeedScreen = ({ navigation }) => {
  // Estado para la lista de posts
  const [feed, setFeed] = useState([]);
  // Estado para saber si está cargando los posts
  const [loading, setLoading] = useState(true);
  // Estado para mostrar el modal de crear post
  const [modalVisible, setModalVisible] = useState(false);
  // Estado para el texto del nuevo post
  const [newPost, setNewPost] = useState('');
  // Estado para saber si está publicando
  const [posting, setPosting] = useState(false);
  // Estado para la imagen o vídeo del nuevo post
  const [media, setMedia] = useState(null); // { uri, type, name }

  // Función para cargar los posts internos de la base de datos
  const fetchInternalPosts = async () => {
    // Pedimos los posts y sus datos relacionados (usuario, likes, comentarios)
    const { data, error } = await supabase
      .from('posts')
      .select(`
        id, content, category, created_at, user_id,
        users:fk_user (
          username,
          avatar_url
        ),
        post_likes(count),
        comments:fk_post(
          id,
          content,
          created_at,
          user_id,
          users:fk_user(username, avatar_url)
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error al cargar posts internos:', error.message);
      return [];
    }

    // Para cada post, buscamos si tiene imagen o vídeo asociado
    const postsWithMedia = await Promise.all(data.map(async post => {
      const { data: media } = await supabase
        .from('post_media')
        .select('url, type')
        .eq('post_id', post.id)
        .maybeSingle();
      return {
        id: post.id,
        content: post.content,
        category: post.category,
        created_at: post.created_at,
        user_id: post.user_id,
        username: post.users?.username || 'Anónimo',
        avatar: post.users?.avatar_url || null,
        media,
        likes_count: post.post_likes?.[0]?.count || 0,
        comments: post.comments || [],
      };
    }));

    return postsWithMedia;
  };

  // Al montar el componente, cargamos el feed
  useEffect(() => {
    const loadFeed = async () => {
      setLoading(true);
      const internal = await fetchInternalPosts();
      setFeed(internal);
      setLoading(false);
    };

    loadFeed();
  }, []);

  // Función para publicar un nuevo post
  const handlePost = async () => {
    if (!newPost.trim()) return;
    setPosting(true);
    // Comprobamos que el usuario está logueado
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      Alert.alert('Debes iniciar sesión para publicar');
      setPosting(false);
      return;
    }

    // 1. Insertamos el post en la base de datos
    const { data: postData, error: postError } = await supabase
      .from('posts')
      .insert([{ content: newPost, user_id: user.id, category: 'general' }])
      .select()
      .single();

    if (postError) {
      Alert.alert('Error al publicar', postError.message);
      setPosting(false);
      return;
    }

    // 2. Si hay imagen o vídeo, lo subimos a Supabase Storage y guardamos la URL
    if (media) {
      try {
        let fileExt = 'jpg';
        if (media.type === 'image') fileExt = 'jpg';
        if (media.type === 'video') fileExt = 'mp4';
        const filePath = `${postData.id}/${Date.now()}.${fileExt}`;
        const response = await fetch(media.uri);
        const blob = await response.blob();

        // Subimos el archivo a Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('postsmedia')
          .upload(filePath, blob, {
            contentType: media.type === 'image' ? 'image/jpeg' : 'video/mp4',
            upsert: false,
          });

        if (uploadError) {
          Alert.alert('Error al subir la imagen/video', uploadError.message);
          setPosting(false);
          return;
        }
        if (!uploadData) {
          Alert.alert('No se recibió respuesta de Supabase Storage');
          setPosting(false);
          return;
        }

        // Obtenemos la URL pública del archivo subido
        const { data: publicUrlData, error: publicUrlError } = supabase.storage
          .from('postsmedia')
          .getPublicUrl(filePath);

        if (publicUrlError || !publicUrlData?.publicUrl) {
          Alert.alert('Error al obtener la URL pública de la imagen');
          setPosting(false);
          return;
        }

        // Guardamos la URL en la tabla post_media
        const { error: mediaError } = await supabase.from('post_media').insert([{
          post_id: postData.id,
          url: publicUrlData.publicUrl,
          type: media.type,
        }]);
        if (mediaError) {
          Alert.alert('Error al guardar la media', mediaError.message);
          setPosting(false);
          return;
        }
      } catch (e) {
        Alert.alert('Error inesperado al subir la imagen', e.message);
        setPosting(false);
        return;
      }
    }

    // Limpiamos el formulario y recargamos el feed
    setNewPost('');
    setMedia(null);
    setModalVisible(false);
    const internal = await fetchInternalPosts();
    setFeed(internal);
    setPosting(false);
  };

  // Función para elegir imagen o vídeo de la galería
  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      const file = result.assets[0];
      setMedia({
        uri: file.uri,
        type: file.type === 'video' ? 'video' : 'image',
        name: file.fileName || `media_${Date.now()}`,
      });
    }
  };

  // Renderiza cada post del feed
  const renderItem = ({ item }) => (
    <TouchableOpacity
      onPress={() => navigation.navigate('FeedDetail', { post: item })}
      style={styles.card}
      activeOpacity={0.85}
    >
      <View style={styles.cardHeader}>
        {item.avatar ? (
          <Image source={{ uri: item.avatar }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, { backgroundColor: '#e5e7eb', justifyContent: 'center', alignItems: 'center' }]}>
            <Text style={{ color: '#6366F1', fontWeight: 'bold', fontSize: 22 }}>{item.username?.[0]?.toUpperCase() || 'U'}</Text>
          </View>
        )}
        <View style={{ flex: 1, marginLeft: 8 }}>
          <Text style={styles.username}>{item.username}</Text>
          <Text style={styles.meta}>{new Date(item.created_at).toLocaleDateString()}</Text>
        </View>
        {/* Icono de like visual */}
        <Ionicons name="heart-outline" size={22} color="#888" style={{ marginLeft: 8 }} />
        <Text style={{ color: '#888', marginLeft: 4, fontWeight: 'bold' }}>
          {item.likes_count}
        </Text>
      </View>
      <Text style={styles.content}>{item.content}</Text>
      {/* Si el post tiene imagen, la mostramos */}
      {item.media && item.media.type === 'image' && (
        <Image source={{ uri: item.media.url }} style={{ width: '100%', height: 200, borderRadius: 12, marginBottom: 8 }} />
      )}
      {/* Si el post tiene vídeo, mostramos un texto */}
      {item.media && item.media.type === 'video' && (
        <Text style={{ color: '#6366F1', marginBottom: 8 }}>[Vídeo adjunto]</Text>
      )}
      {/* Mostramos los comentarios del post */}
      {item.comments && item.comments.length > 0 && (
        <View style={{ marginTop: 8 }}>
          <Text style={{ color: '#6366F1', fontWeight: 'bold', marginBottom: 4 }}>Comentarios:</Text>
          {item.comments
            .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
            .map(comment => (
              <View key={comment.id} style={{ marginBottom: 6, paddingLeft: 8 }}>
                <Text style={{ color: '#374151', fontWeight: 'bold' }}>
                  {comment.users?.username || 'Usuario'}:
                </Text>
                <Text style={{ color: '#374151' }}>{comment.content}</Text>
                <Text style={{ color: '#888', fontSize: 11 }}>
                  {new Date(comment.created_at).toLocaleString()}
                </Text>
              </View>
            ))}
        </View>
      )}
    </TouchableOpacity>
  );

  // Render principal de la pantalla
  return (
    <View style={styles.container}>
      <Text style={styles.feedTitle}>Feed de la comunidad</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#6366F1" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={feed}
          keyExtractor={item => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 80 }}
        />
      )}

      {/* Botón flotante para crear post */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={32} color="#fff" />
      </TouchableOpacity>

      {/* Modal para crear post nuevo */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Nuevo post</Text>
            <TextInput
              style={styles.input}
              placeholder="¿Qué quieres compartir?"
              value={newPost}
              onChangeText={setNewPost}
              multiline
              autoFocus
            />
            <TouchableOpacity onPress={pickImage} style={{ marginBottom: 12 }}>
              <Text style={{ color: '#6366F1', fontWeight: 'bold' }}>
                {media ? 'Cambiar imagen/video' : 'Añadir imagen/video'}
              </Text>
            </TouchableOpacity>
            {media && (
              media.type === 'image' ? (
                <Image source={{ uri: media.uri }} style={{ width: 120, height: 120, borderRadius: 8, marginBottom: 8 }} />
              ) : (
                <Text style={{ color: '#6366F1', marginBottom: 8 }}>Vídeo seleccionado</Text>
              )
            )}
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12 }}>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.cancelBtn}>
                <Text style={{ color: '#6366F1', fontWeight: 'bold' }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.publishButton}
                onPress={handlePost}
                disabled={posting || !newPost.trim()}
              >
                <Text style={styles.publishButtonText}>{posting ? 'Publicando...' : 'Publicar'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB', padding: 0 },
  feedTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#6366F1',
    marginBottom: 12,
    textAlign: 'center',
    marginTop: 24,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 0,
  },
  username: {
    fontWeight: 'bold',
    color: '#222',
    fontSize: 17,
  },
  meta: {
    color: '#888',
    fontSize: 12,
    marginTop: 2,
  },
  content: {
    color: '#374151',
    fontSize: 16,
    marginTop: 2,
    marginBottom: 2,
    lineHeight: 22,
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 32,
    backgroundColor: '#6366F1',
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(30,30,40,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '85%',
    elevation: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6366F1',
    marginBottom: 12,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 12,
    minHeight: 60,
    marginBottom: 12,
    color: '#222',
    fontSize: 16,
  },
  cancelBtn: {
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: 'transparent',
    marginRight: 8,
  },
  publishButton: {
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#6366F1',
    marginLeft: 8,
  },
  publishButtonText: {
    fontWeight: 'bold',
    color: '#fff',
  },
});

export default FeedScreen;
