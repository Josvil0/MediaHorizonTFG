// Pantalla de perfil del usuario.
// Aquí el usuario puede ver y editar su información personal, su avatar y su biografía.
// También puede ver cuántos posts y comentarios ha hecho y cerrar sesión.

import React, { useEffect, useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ActivityIndicator, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import supabase from '../Services/supabaseClient';

export default function ProfileScreen({ navigation }) {
  // Estado para guardar los datos del perfil
  const [profile, setProfile] = useState(null);
  // Estado para saber si está cargando el perfil
  const [loading, setLoading] = useState(true);
  // Estado para saber si está en modo edición
  const [editing, setEditing] = useState(false);
  // Estado para la bio editable
  const [bio, setBio] = useState('');
  // Estado para la URL del avatar
  const [avatarUrl, setAvatarUrl] = useState('');
  // Estado para saber si está guardando los cambios
  const [saving, setSaving] = useState(false);
  // Estado para las estadísticas del usuario (posts y comentarios)
  const [stats, setStats] = useState({ posts: 0, comments: 0 });

  // Al montar, carga el perfil del usuario desde Supabase
  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();
      setProfile(data);
      setBio(data?.bio || '');
      setAvatarUrl(data?.avatar_url || '');
      setLoading(false);
    };
    fetchProfile();
  }, []);

  // Al montar, carga las estadísticas del usuario (número de posts y comentarios)
  useEffect(() => {
    const fetchStats = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      // Cuenta posts
      const { count: postsCount } = await supabase
        .from('posts')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id);

      // Cuenta comentarios
      const { count: commentsCount } = await supabase
        .from('comments')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id);

      setStats({
        posts: postsCount || 0,
        comments: commentsCount || 0,
      });
    };

    fetchStats();
  }, []);

  // Función para elegir una nueva imagen de avatar
  const pickAvatar = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setAvatarUrl(result.assets[0].uri);
    }
  };

  // Función para guardar los cambios del perfil
  const handleSave = async () => {
    setSaving(true);
    let uploadedUrl = avatarUrl;

    try {
      // Si la imagen es local, la sube a Supabase Storage
      if (avatarUrl && avatarUrl.startsWith('file')) {
        const { data: { user } } = await supabase.auth.getUser();
        const fileExt = avatarUrl.split('.').pop();
        const fileName = `${user.id}.${fileExt}`;
        const file = {
          uri: avatarUrl,
          name: fileName,
          type: 'image/' + fileExt,
        };

        let { error } = await supabase.storage
          .from('avatars')
          .upload(fileName, file, { upsert: true, contentType: file.type });

        if (error) throw error;

        // Obtiene la URL pública del avatar
        const { data: publicUrlData } = supabase
          .storage
          .from('avatars')
          .getPublicUrl(fileName);

        uploadedUrl = publicUrlData.publicUrl;
      }

      // Actualiza el perfil en la base de datos
      const { data, error } = await supabase
        .from('users')
        .update({ bio, avatar_url: uploadedUrl })
        .eq('id', profile.id);

      if (error) throw error;

      setProfile({ ...profile, bio, avatar_url: uploadedUrl });
      setEditing(false);
      Alert.alert('Perfil actualizado');
    } catch (err) {
      Alert.alert('Error', err.message || 'No se pudo actualizar el perfil');
    }
    setSaving(false);
  };

  // Función para cerrar sesión
  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigation.reset({ index: 0, routes: [{ name: 'Auth' }] });
  };

  // Si está cargando, muestra un spinner
  if (loading) {
    return <ActivityIndicator size="large" color="#6366F1" style={{ flex: 1, marginTop: 40 }} />;
  }

  return (
    <View style={styles.container}>
      {/* Flecha de volver */}
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={28} color="#6366F1" />
      </TouchableOpacity>

      {/* Imagen y nombre */}
      <TouchableOpacity onPress={editing ? pickAvatar : undefined} style={styles.avatarContainer}>
        {profile?.avatar_url || avatarUrl ? (
          <Image source={{ uri: avatarUrl || profile.avatar_url }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, { backgroundColor: '#ddd', justifyContent: 'center', alignItems: 'center' }]}>
            <Text style={{ fontSize: 32, color: '#888' }}>{profile?.username?.[0]?.toUpperCase() || '?'}</Text>
          </View>
        )}
        {editing && <Text style={styles.editAvatarText}>Cambiar imagen</Text>}
      </TouchableOpacity>
      <Text style={styles.username}>{profile?.username}</Text>
      <Text style={styles.email}>{profile?.email}</Text>

      {/* Bio editable */}
      {editing ? (
        <TextInput
          style={styles.bioInput}
          value={bio}
          onChangeText={setBio}
          placeholder="Biografía"
          multiline
        />
      ) : (
        profile?.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null
      )}
      <Text style={styles.bio}>
        Miembro desde {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : ''}
      </Text>

      {/* Estadísticas de usuario */}
      <View style={{ flexDirection: 'row', marginTop: 16 }}>
        <View style={{ alignItems: 'center', marginHorizontal: 16 }}>
          <Text style={{ fontWeight: 'bold', fontSize: 18, color: '#6366F1' }}>{stats.posts}</Text>
          <Text style={{ color: '#888', fontSize: 13 }}>Posts</Text>
        </View>
        <View style={{ alignItems: 'center', marginHorizontal: 16 }}>
          <Text style={{ fontWeight: 'bold', fontSize: 18, color: '#6366F1' }}>{stats.comments}</Text>
          <Text style={{ color: '#888', fontSize: 13 }}>Comentarios</Text>
        </View>
      </View>
      <View style={{ height: 1, backgroundColor: '#e5e7eb', width: '80%', marginVertical: 24 }} />
      <Text style={{ color: '#888', fontStyle: 'italic', marginBottom: 16 }}>
        ¡Personaliza tu perfil y hazlo único!
      </Text>

      {/* Botones para editar o guardar */}
      {editing ? (
        <TouchableOpacity style={styles.button} onPress={handleSave} disabled={saving}>
          <Text style={styles.buttonText}>{saving ? 'Guardando...' : 'Guardar cambios'}</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={styles.button} onPress={() => setEditing(true)}>
          <Text style={styles.buttonText}>Editar perfil</Text>
        </TouchableOpacity>
      )}

      {/* Botón para cerrar sesión */}
      <TouchableOpacity style={[styles.button, { backgroundColor: '#EF4444' }]} onPress={handleLogout}>
        <Text style={styles.buttonText}>Cerrar sesión</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', backgroundColor: '#f9fafb', padding: 24, paddingTop: 48 },
  backButton: { position: 'absolute', top: 40, left: 16, zIndex: 10 },
  avatarContainer: { alignItems: 'center', marginBottom: 8, marginTop: 16 },
  avatar: { width: 110, height: 110, borderRadius: 55, marginBottom: 8 },
  editAvatarText: { color: '#6366F1', fontSize: 14, marginBottom: 8 },
  username: { fontSize: 22, fontWeight: 'bold', marginBottom: 4, color: '#6366F1', marginTop: 4 },
  email: { fontSize: 16, color: '#6B7280', marginBottom: 8 },
  bio: { fontSize: 14, color: '#374151', marginBottom: 16, textAlign: 'center' },
  bioInput: {
    backgroundColor: '#fff', padding: 12, borderRadius: 8, marginBottom: 16,
    borderWidth: 1, borderColor: '#e5e7eb', fontSize: 16, minWidth: 220, minHeight: 60, textAlignVertical: 'top'
  },
  button: { backgroundColor: '#6366F1', padding: 12, borderRadius: 8, marginTop: 12, width: 180, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});