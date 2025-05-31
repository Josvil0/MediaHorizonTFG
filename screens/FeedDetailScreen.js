import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Linking, Alert, TextInput, ScrollView, ActivityIndicator, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import supabase from '../Services/supabaseClient';
import CommentsSection from '../Components/ComentsSection';

// Pantalla que muestra el detalle de un post del feed
export default function FeedDetailScreen({ route, navigation }) {
  // Recibimos el post por parámetros de navegación
  const { post } = route.params;

  // Estados para controlar likes, edición, favoritos, comentarios, etc.
  const [likes, setLikes] = useState(post.likes_count || 0); // Número de likes
  const [liked, setLiked] = useState(false); // Si el usuario ha dado like
  const [editing, setEditing] = useState(false); // Si está editando el post
  const [editText, setEditText] = useState(post.content); // Texto a editar
  const [currentUserId, setCurrentUserId] = useState(undefined); // ID del usuario logueado
  const [favorited, setFavorited] = useState(false); // Si el usuario ha marcado como favorito
  const [postData, setPostData] = useState(post); // Datos del post (pueden cambiar si se edita)
  const [showDeleteModal, setShowDeleteModal] = useState(false); // Mostrar modal de borrar
  const [comments, setComments] = useState([]); // Lista de comentarios
  const [commentText, setCommentText] = useState(''); // Texto del nuevo comentario
  const [loadingComments, setLoadingComments] = useState(true); // Cargando comentarios
  const [postingComment, setPostingComment] = useState(false); // Estado al enviar comentario

  // Al montar, obtenemos el usuario autenticado
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUserId(user?.id ?? null);
      console.log('Usuario autenticado:', user?.id);
    });
  }, []);

  // Comprobamos si el usuario ya ha dado like o favorito a este post
  useEffect(() => {
    if (!currentUserId) return;
    // Comprobar like
    supabase
      .from('post_likes')
      .select('id')
      .eq('post_id', post.id)
      .eq('user_id', currentUserId)
      .then(({ data }) => setLiked(!!data?.length));

    // Comprobar favorito
    supabase
      .from('post_favorites')
      .select('id')
      .eq('post_id', post.id)
      .eq('user_id', currentUserId)
      .then(({ data }) => setFavorited(!!data?.length));
  }, [currentUserId, post.id]);

  // Cargar los comentarios del post
  useEffect(() => {
    const fetchComments = async () => {
      setLoadingComments(true);
      const { data, error } = await supabase
        .from('comments')
        .select(`
          id, content, created_at, user_id,
          users:fk_user(username, avatar_url)
        `)
        .eq('item_type', 'post')
        .eq('item_id', post.id)
        .order('created_at', { ascending: true });
      setComments(data || []);
      setLoadingComments(false);
    };
    fetchComments();
  }, [post.id]);

  // Si aún no sabemos el usuario, mostramos un spinner
  if (currentUserId === undefined) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' }}>
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );
  }

  // Comprobamos si el usuario es el dueño del post
  const isOwner = !!currentUserId && currentUserId === post.user_id;

  // Función para dar o quitar like
  const handleLike = async () => {
    if (!currentUserId || isOwner) return;
    if (liked) {
      // Quitar like
      await supabase.from('post_likes').delete().eq('post_id', post.id).eq('user_id', currentUserId);
      setLiked(false);
      setLikes(likes - 1);
    } else {
      // Dar like
      await supabase.from('post_likes').insert([{ post_id: post.id, user_id: currentUserId }]);
      setLiked(true);
      setLikes(likes + 1);
    }
  };

  // Función para guardar los cambios al editar el post
  const handleEdit = async () => {
    const { error } = await supabase
      .from('posts')
      .update({ content: editText })
      .eq('id', post.id);

    if (!error) {
      setPostData({ ...postData, content: editText });
      setEditText(editText);
      setEditing(false);
      Alert.alert('Post actualizado');
    } else {
      Alert.alert('Error al actualizar el post', error.message);
    }
  };

  // Mostrar modal de confirmación para borrar
  const handleDelete = () => {
    setShowDeleteModal(true);
  };

  // Confirmar y borrar el post
  const confirmDelete = async () => {
    setShowDeleteModal(false);
    const { error } = await supabase.from('posts').delete().eq('id', post.id);
    if (!error) {
      navigation.goBack();
    }
  };

  // Marcar o desmarcar como favorito
  const handleFavorite = async () => {
    if (!currentUserId || isOwner) return;
    if (favorited) {
      await supabase.from('post_favorites').delete().eq('post_id', post.id).eq('user_id', currentUserId);
      setFavorited(false);
    } else {
      await supabase.from('post_favorites').insert([{ post_id: post.id, user_id: currentUserId }]);
      setFavorited(true);
    }
  };

  // Ir al perfil del usuario del post
  const goToProfile = () => {
    const userId = post.user_id || post.users?.id;
    if (!userId) {
      Alert.alert('Usuario no encontrado');
      return;
    }
    if (userId === currentUserId) {
      navigation.navigate('MainTabs', { screen: 'Perfil' });
    } else {
      navigation.navigate('UserProfile', { userId });
    }
  };

  // Enviar un nuevo comentario
  const handleSendComment = async () => {
    if (!commentText.trim()) return;
    setPostingComment(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      Alert.alert('Debes iniciar sesión para comentar');
      setPostingComment(false);
      return;
    }
    const { error } = await supabase.from('comments').insert([{
      item_type: 'post',
      item_id: post.id,
      user_id: user.id,
      content: commentText.trim(),
    }]);
    if (!error) {
      setCommentText('');
      // Recarga comentarios
      const { data } = await supabase
        .from('comments')
        .select(`
          id, content, created_at, user_id,
          users:fk_user(username, avatar_url)
        `)
        .eq('item_type', 'post')
        .eq('item_id', post.id)
        .order('created_at', { ascending: true });
      setComments(data || []);
    }
    setPostingComment(false);
  };

  // Render principal de la pantalla
  return (
    <>
      <ScrollView style={styles.container}>
        {/* Botón para volver atrás */}
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={28} color="#6366F1" />
        </TouchableOpacity>

        {/* Imagen o vídeo del post */}
        {post.media && post.media.type === 'image' && (
          <View style={styles.imageBox}>
            <Image
              source={{ uri: post.media.url }}
              style={styles.image}
              resizeMode="contain"
            />
          </View>
        )}
        {post.media && post.media.type === 'video' && (
          <View style={styles.imageBox}>
            <Ionicons name="videocam" size={40} color="#6366F1" />
            <Text style={{ color: '#6366F1', fontWeight: 'bold', marginTop: 4 }}>[Vídeo adjunto]</Text>
          </View>
        )}

        {/* Cabecera con avatar y nombre de usuario */}
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.avatarBox} onPress={goToProfile}>
            {postData.avatar ? (
              <Image source={{ uri: postData.avatar }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitial}>{postData.username?.[0]?.toUpperCase() || 'U'}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.userInfo} onPress={goToProfile}>
            <Text style={styles.username}>{postData.username || 'Usuario'}</Text>
            <Text style={styles.meta}>{new Date(postData.created_at).toLocaleString()}</Text>
          </TouchableOpacity>
        </View>

        {/* Contenido del post y acciones de edición si es el dueño */}
        <View style={styles.contentBox}>
          {editing ? (
            <View>
              <TextInput
                value={editText}
                onChangeText={setEditText}
                style={styles.input}
                multiline
              />
              <View style={{ flexDirection: 'row', marginTop: 8 }}>
                <TouchableOpacity onPress={handleEdit} style={styles.saveBtn}>
                  <Text style={{ color: '#fff', fontWeight: 'bold' }}>Guardar</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setEditing(false)} style={styles.cancelBtn}>
                  <Text style={{ color: '#6366F1', fontWeight: 'bold' }}>Cancelar</Text>
                </TouchableOpacity>
                {/* Botón de borrar también disponible en modo edición */}
                <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn}>
                  <Ionicons name="trash-outline" size={18} color="#EF4444" />
                  <Text style={{ color: '#EF4444', fontWeight: 'bold', marginLeft: 6 }}>Borrar</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View>
              <Text style={styles.content}>{postData.content}</Text>
              {isOwner && (
                <View style={{ flexDirection: 'row', marginTop: 8 }}>
                  <TouchableOpacity onPress={() => setEditing(true)} style={styles.editBtn}>
                    <Ionicons name="create-outline" size={18} color="#6366F1" />
                    <Text style={{ color: '#6366F1', fontWeight: 'bold', marginLeft: 6 }}>Editar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn}>
                    <Ionicons name="trash-outline" size={18} color="#EF4444" />
                    <Text style={{ color: '#EF4444', fontWeight: 'bold', marginLeft: 6 }}>Borrar</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Acciones sociales: like y favorito */}
        {!isOwner && currentUserId && (
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[
                styles.actionPill,
                { backgroundColor: liked ? '#EF4444' : '#e5e7eb' }
              ]}
              onPress={handleLike}
            >
              <Ionicons name={liked ? "heart" : "heart-outline"} size={24} color={liked ? "#fff" : "#EF4444"} />
              <Text style={[styles.actionPillText, { color: liked ? "#fff" : "#EF4444" }]}>{likes}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.actionPill,
                { backgroundColor: favorited ? '#374151' : '#e5e7eb' }
              ]}
              onPress={handleFavorite}
            >
              <Ionicons name={favorited ? "bookmark" : "bookmark-outline"} size={24} color={favorited ? "#fff" : "#374151"} />
            </TouchableOpacity>
          </View>
        )}

        {/* Enlace externo si el post lo tiene */}
        {post.external && (
          <TouchableOpacity style={styles.linkBtn} onPress={() => Linking.openURL(post.link)}>
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>Ver noticia original</Text>
          </TouchableOpacity>
        )}

        {/* Sección de comentarios */}
        <Text style={{ fontWeight: 'bold', color: '#6366F1', fontSize: 18, marginTop: 24, marginBottom: 8 }}>
          Comentarios
        </Text>
        <CommentsSection itemType="post" itemId={post.id} navigation={navigation} />
      </ScrollView>

      {/* Modal para confirmar el borrado del post */}
      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={{
          flex: 1, justifyContent: 'center', alignItems: 'center',
          backgroundColor: 'rgba(0,0,0,0.4)'
        }}>
          <View style={{
            backgroundColor: '#fff', borderRadius: 12, padding: 24, alignItems: 'center', minWidth: 260
          }}>
            <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 12 }}>¿Borrar post?</Text>
            <Text style={{ color: '#444', marginBottom: 20 }}>¿Seguro que quieres borrar este post?</Text>
            <View style={{ flexDirection: 'row' }}>
              <TouchableOpacity
                onPress={() => setShowDeleteModal(false)}
                style={{ marginRight: 16, padding: 10 }}
              >
                <Text style={{ color: '#6366F1', fontWeight: 'bold' }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={confirmDelete}
                style={{ padding: 10 }}
              >
                <Text style={{ color: '#EF4444', fontWeight: 'bold' }}>Borrar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

// Los estilos para la pantalla (colores, márgenes, etc.)
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  backBtn: { marginTop: 36, marginLeft: 16, marginBottom: 0, alignSelf: 'flex-start' },
  imageBox: {
    width: '100%',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  image: {
    width: '92%',
    height: 180,
    borderRadius: 16,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 18,
    marginBottom: 8,
    marginTop: 2,
  },
  avatarBox: { marginRight: 10 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#e5e7eb' },
  avatarPlaceholder: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: '#e5e7eb',
    alignItems: 'center', justifyContent: 'center'
  },
  avatarInitial: { color: '#6366F1', fontWeight: 'bold', fontSize: 22 },
  userInfo: { flex: 1 },
  username: { fontWeight: 'bold', color: '#222', fontSize: 17 },
  meta: { color: '#888', fontSize: 12, marginTop: 2 },
  contentBox: {
    backgroundColor: '#fff',
    borderRadius: 14,
    marginHorizontal: 18,
    marginBottom: 18,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 2,
    minHeight: 60,
  },
  content: { color: '#222', fontSize: 16, lineHeight: 22 },
  input: {
    borderColor: '#6366F1', borderWidth: 1, borderRadius: 8,
    padding: 10, backgroundColor: '#f9fafb', fontSize: 16
  },
  saveBtn: {
    backgroundColor: '#6366F1',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 18,
    marginRight: 8,
  },
  cancelBtn: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: '#6366F1',
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#EEF2FF',
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 18,
    gap: 16
  },
  actionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 50,
    paddingVertical: 12,
    paddingHorizontal: 28,
    marginHorizontal: 8,
    backgroundColor: '#6366F1'
  },
  actionPillLike: { backgroundColor: '#6366F1' },
  actionPillFav: { backgroundColor: '#F59E42' },
  actionPillDisabled: { backgroundColor: '#d1d5db' },
  actionPillText: { color: '#fff', fontWeight: 'bold', marginLeft: 10, fontSize: 16 },
  linkBtn: {
    backgroundColor: '#6366F1',
    borderRadius: 8,
    padding: 12,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 16
  },
});