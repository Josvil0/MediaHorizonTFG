// Pantalla para ver el perfil público de otro usuario.
// Aquí se muestra el avatar, nombre, bio, estadísticas y un botón de seguir (aún no funcional).

import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import supabase from '../Services/supabaseClient';

export default function UserProfileScreen({ route, navigation }) {
  // Recibimos el id del usuario por parámetros de navegación
  const { userId } = route.params;
  // Estado para los datos del perfil
  const [profile, setProfile] = useState(null);
  // Estado para saber si está cargando
  const [loading, setLoading] = useState(true);
  // Estado para estadísticas (comentarios y likes recibidos)
  const [stats, setStats] = useState({ comments: 0, likes: 0 });

  // Al montar, carga el perfil y las estadísticas del usuario desde Supabase
  useEffect(() => {
    // Carga los datos básicos del perfil
    const fetchProfile = async () => {
      const { data } = await supabase
        .from('users')
        .select('username, avatar_url, bio, created_at')
        .eq('id', userId)
        .single();
      setProfile(data);
      setLoading(false);
    };

    // Carga el número de comentarios y likes recibidos
    const fetchStats = async () => {
      const { count: comments } = await supabase
        .from('comments')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);
      const { count: likes } = await supabase
        .from('likes')
        .select('*', { count: 'exact', head: true })
        .eq('target_user', userId);
      setStats({ comments: comments || 0, likes: likes || 0 });
    };

    fetchProfile();
    fetchStats();
  }, [userId]);

  // Si está cargando, muestra un spinner
  if (loading) {
    return <ActivityIndicator size="large" color="#6366F1" style={{ flex: 1, marginTop: 40 }} />;
  }

  // Si no se encuentra el usuario, muestra un mensaje
  if (!profile) {
    return <Text style={{ textAlign: 'center', marginTop: 40 }}>Usuario no encontrado</Text>;
  }

  return (
    <View style={styles.container}>
      {/* Botón para volver atrás */}
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={{ color: '#6366F1', fontSize: 18 }}>← Volver</Text>
      </TouchableOpacity>
      {/* Cabecera con avatar y nombre */}
      <View style={styles.header}>
        <View style={styles.avatarShadow}>
          {profile.avatar_url ? (
            <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, { backgroundColor: '#ddd', justifyContent: 'center', alignItems: 'center' }]}>
              <Text style={{ fontSize: 32, color: '#888' }}>{profile.username?.[0]?.toUpperCase() || '?'}</Text>
            </View>
          )}
        </View>
        <Text style={styles.username}>{profile.username}</Text>
        {/* Fecha de registro */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
          <Ionicons name="calendar-outline" size={16} color="#888" style={{ marginRight: 4 }} />
          <Text style={styles.since}>Miembro desde {new Date(profile.created_at).toLocaleDateString()}</Text>
        </View>
        {/* Bio si existe */}
        {profile.bio ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <Ionicons name="information-circle-outline" size={16} color="#6366F1" style={{ marginRight: 4 }} />
            <Text style={styles.bio}>{profile.bio}</Text>
          </View>
        ) : null}
      </View>
      {/* Estadísticas de comentarios y likes */}
      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Ionicons name="chatbubble-ellipses-outline" size={20} color="#6366F1" />
          <Text style={styles.statNumber}>{stats.comments}</Text>
          <Text style={styles.statLabel}>Comentarios</Text>
        </View>
        <View style={styles.statBox}>
          <Ionicons name="heart-outline" size={20} color="#EF4444" />
          <Text style={styles.statNumber}>{stats.likes}</Text>
          <Text style={styles.statLabel}>Likes</Text>
        </View>
      </View>
      <View style={{ height: 1, backgroundColor: '#e5e7eb', width: '80%', marginVertical: 24 }} />

      {/* Botón de seguir (aún no funcional) */}
      <TouchableOpacity style={styles.followButton} disabled>
        <Text style={{ color: '#fff', fontWeight: 'bold' }}>Seguir</Text>
      </TouchableOpacity>

      {/* Mensaje motivacional */}
      <View style={{ marginTop: 32, alignItems: 'center' }}>
        <Ionicons name="sparkles-outline" size={32} color="#6366F1" style={{ marginBottom: 8 }} />
        <Text style={{ color: '#6366F1', fontWeight: 'bold', fontSize: 16, marginBottom: 4 }}>
          ¡Explora y comparte tus opiniones!
        </Text>
        <Text style={{ color: '#888', fontStyle: 'italic', textAlign: 'center' }}>
          Este usuario está construyendo su historia en la comunidad.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', backgroundColor: '#f9fafb', padding: 24, paddingTop: 48 },
  backButton: { position: 'absolute', top: 40, left: 16, zIndex: 10 },
  avatarShadow: {
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 8,
    borderRadius: 60,
    marginBottom: 8,
  },
  avatar: { width: 110, height: 110, borderRadius: 55 },
  username: { fontSize: 22, fontWeight: 'bold', marginBottom: 4, color: '#6366F1', marginTop: 4 },
  bio: { fontSize: 14, color: '#374151', marginBottom: 8, textAlign: 'center' },
  since: { fontSize: 12, color: '#888', marginBottom: 16 },
  statsContainer: { flexDirection: 'row', justifyContent: 'center', marginBottom: 12 },
  statBox: {
    alignItems: 'center',
    marginHorizontal: 24,
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 18,
    shadowColor: '#6366F1',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  statNumber: { fontWeight: 'bold', fontSize: 18, color: '#6366F1' },
  statLabel: { color: '#888', fontSize: 13 },
  followButton: {
    backgroundColor: '#6366F1',
    paddingVertical: 8,
    paddingHorizontal: 32,
    borderRadius: 20,
    marginBottom: 16,
    marginTop: 4,
    opacity: 0.8,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
});

console.log('UserProfileScreen file loaded');