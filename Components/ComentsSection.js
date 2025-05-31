// Componente para mostrar y gestionar los comentarios de un post, película, libro o canción.
// Permite ver, escribir, editar, borrar y dar like a los comentarios.
// Cada comentario muestra el usuario, la fecha y los likes recibidos.

import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Image, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import supabase from '../Services/supabaseClient';

export default function CommentsSection({ itemType, itemId, navigation: navProp }) {
  // Hook para navegar entre pantallas (si no viene por props)
  const navigation = navProp || useNavigation();
  // Estado para la lista de comentarios
  const [comments, setComments] = useState([]);
  // Estado para el texto del nuevo comentario
  const [text, setText] = useState('');
  // Estado para saber si está enviando un comentario
  const [loading, setLoading] = useState(false);
  // Estado para el id del usuario actual
  const [currentUserId, setCurrentUserId] = useState(null);
  // Estado para saber si se está editando un comentario
  const [editingId, setEditingId] = useState(null);
  // Estado para el texto al editar
  const [editText, setEditText] = useState('');
  // Estado para los likes de cada comentario
  const [likes, setLikes] = useState({});

  // Función para cargar los comentarios de este item
  const fetchComments = async () => {
    const { data, error } = await supabase
      .from('comments')
      .select(`
        id,
        content,
        created_at,
        user_id,
        users!user_id (
          id,
          username,
          avatar_url
        )
      `)
      .eq('item_type', itemType)
      .eq('item_id', itemId)
      .order('created_at', { ascending: false });
    if (!error) setComments(data || []);
  };

  // Función para cargar los likes de los comentarios
  const fetchLikes = async () => {
    if (!comments.length) {
      setLikes({});
      return;
    }
    const { data } = await supabase
      .from('likes')
      .select('id, user_id, target_id')
      .eq('target_type', 'comment')
      .in('target_id', comments.map(c => c.id));
    // Agrupa likes por comentario
    const likeMap = {};
    data?.forEach(like => {
      if (!likeMap[like.target_id]) likeMap[like.target_id] = [];
      likeMap[like.target_id].push(like.user_id);
    });
    setLikes(likeMap);
  };

  // Al montar, obtenemos el usuario y los comentarios
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUserId(user?.id);
    });
    fetchComments();
  }, []);

  // Cuando cambian los comentarios, recargamos los likes
  useEffect(() => {
    if (comments.length > 0) fetchLikes();
  }, [comments]);

  // Función para enviar un nuevo comentario
  const handleSend = async () => {
    if (!text.trim()) return;
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('comments').insert([{
      user_id: user.id,
      item_type: itemType,
      item_id: itemId,
      content: text,
    }]);
    setText('');
    fetchComments();
    setLoading(false);
  };

  // Función para empezar a editar un comentario
  const handleEdit = (item) => {
    setEditingId(item.id);
    setEditText(item.content);
  };

  // Función para guardar la edición de un comentario
  const handleSaveEdit = async () => {
    await supabase.from('comments').update({ content: editText }).eq('id', editingId);
    setEditingId(null);
    setEditText('');
    fetchComments();
  };

  // Función para borrar un comentario
  const handleDelete = async (id) => {
    await supabase.from('comments').delete().eq('id', id);
    fetchComments();
  };

  // Función para dar o quitar like a un comentario
  const handleLike = async (commentId) => {
    const alreadyLiked = likes[commentId]?.includes(currentUserId);
    if (alreadyLiked) {
      await supabase
        .from('likes')
        .delete()
        .eq('target_type', 'comment')
        .eq('target_id', commentId)
        .eq('user_id', currentUserId);
    } else {
      await supabase
        .from('likes')
        .insert([
          {
            target_type: 'comment',
            target_id: commentId,
            user_id: currentUserId
          }
        ]);
    }
    fetchLikes();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Comentarios</Text>
      {/* Lista de comentarios */}
      <FlatList
        data={comments}
        keyExtractor={item => item.id?.toString() || Math.random().toString()}
        renderItem={({ item }) => {
          // Cada comentario muestra avatar, nombre, texto, fecha y botones de acción
          return (
            <View style={styles.commentCard}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <TouchableOpacity
                  onPress={() => {
                    if (item.users) {
                      if (item.user_id === currentUserId) {
                        navigation.navigate('MainTabs', { screen: 'Perfil' }); // Si es el propio usuario
                      } else {
                        navigation.navigate('UserProfile', { userId: item.user_id }); // Si es otro usuario
                      }
                    } else {
                      Alert.alert('Usuario no encontrado', 'Este usuario ya no existe.');
                    }
                  }}
                  style={{ flexDirection: 'row', alignItems: 'center' }}
                >
                  {item.users?.avatar_url ? (
                    <Image
                      source={{ uri: item.users.avatar_url }}
                      style={{ width: 32, height: 32, borderRadius: 16, marginRight: 8 }}
                    />
                  ) : (
                    <View style={{
                      width: 32, height: 32, borderRadius: 16, marginRight: 8,
                      backgroundColor: '#e5e7eb', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <Text style={{ color: '#6366F1', fontWeight: 'bold' }}>
                        {item.users?.username?.[0]?.toUpperCase() || 'U'}
                      </Text>
                    </View>
                  )}
                  <Text style={styles.username}>{item.users?.username || 'Usuario'}</Text>
                </TouchableOpacity>
              </View>
              {/* Si está en modo edición, muestra el input */}
              {editingId === item.id ? (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <TextInput
                    value={editText}
                    onChangeText={setEditText}
                    style={[styles.input, { flex: 1, marginRight: 8 }]}
                  />
                  <TouchableOpacity onPress={handleSaveEdit}>
                    <Text style={{ color: '#6366F1', fontWeight: 'bold' }}>Guardar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setEditingId(null)}>
                    <Text style={{ color: '#EF4444', marginLeft: 8 }}>Cancelar</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <Text style={styles.comment}>{item.content}</Text>
              )}
              <Text style={styles.date}>{new Date(item.created_at).toLocaleString()}</Text>
              {/* Botones de editar y borrar solo si es el autor */}
              {item.user_id === currentUserId && (
                <View style={{ flexDirection: 'row', marginTop: 4 }}>
                  {editingId === item.id ? (
                    <TouchableOpacity onPress={handleSaveEdit}>
                      <Text style={{ color: '#6366F1', marginRight: 12 }}>Guardar</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity onPress={() => handleEdit(item)}>
                      <Text style={{ color: '#6366F1', marginRight: 12 }}>Editar</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity onPress={() => handleDelete(item.id)}>
                    <Text style={{ color: '#EF4444' }}>Borrar</Text>
                  </TouchableOpacity>
                </View>
              )}
              {/* Botón de like */}
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                <TouchableOpacity
                  disabled={item.user_id === currentUserId}
                  onPress={() => handleLike(item.id)}
                  style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 8 }}
                >
                  <Text style={{
                    color: likes[item.id]?.includes(currentUserId) ? '#6366F1' : '#888',
                    fontWeight: 'bold',
                    fontSize: 20
                  }}>
                    ♥
                  </Text>
                  <Text style={{ marginLeft: 4, color: '#888' }}>
                    {likes[item.id]?.length || 0}
                  </Text>
                </TouchableOpacity>
                {item.user_id === currentUserId && (
                  <Text style={{ marginLeft: 8, color: '#888', fontSize: 12 }}>
                    (Tus likes)
                  </Text>
                )}
              </View>
            </View>
          );
        }}
        style={{ maxHeight: 200 }}
      />
      {/* Input para escribir un comentario nuevo */}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Escribe un comentario..."
          value={text}
          onChangeText={setText}
        />
        <TouchableOpacity style={styles.sendButton} onPress={handleSend} disabled={loading}>
          <Text style={styles.sendButtonText}>Enviar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// Los estilos están abajo y tienen nombres descriptivos para cada parte de la pantalla
const styles = StyleSheet.create({
  container: { marginTop: 24, marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 8, color: '#6366F1' },
  commentCard: { backgroundColor: '#fff', borderRadius: 8, padding: 8, marginBottom: 8 },
  username: { fontWeight: 'bold', color: '#6366F1' },
  comment: { color: '#222', marginBottom: 2 },
  date: { fontSize: 10, color: '#888' },
  inputRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  input: { flex: 1, backgroundColor: '#f3f4f6', borderRadius: 8, padding: 8, marginRight: 8 },
  sendButton: { backgroundColor: '#6366F1', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 16 },
  sendButtonText: { color: '#fff', fontWeight: 'bold' },
  editInput: { backgroundColor: '#f3f4f6', borderRadius: 8, padding: 8, marginTop: 4 },
});