import React, { useState } from 'react'; // Importa React y useState para manejo de estado
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Image } from 'react-native'; // Componentes de React Native
import * as ImagePicker from 'expo-image-picker'; // Para seleccionar imágenes desde la galería
import supabase from '../Services/supabaseClient'; // Cliente supabase configurado para backend

export default function CompleteProfileScreen({ navigation }) {
  // Estados para manejar datos de usuario y UI
  const [username, setUsername] = useState(''); // Nombre de usuario
  const [bio, setBio] = useState(''); // Biografía del usuario
  const [avatarUrl, setAvatarUrl] = useState(''); // URL local o pública del avatar
  const [loading, setLoading] = useState(false); // Indicador de carga para mostrar durante operaciones
  const [errorMsg, setErrorMsg] = useState(''); // Mensaje de error para mostrar al usuario

  // Función para abrir la galería y seleccionar una imagen de avatar
  const pickAvatar = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, // Solo imágenes
      allowsEditing: true, // Permitir recortar la imagen
      aspect: [1, 1], // Proporción cuadrada para el avatar
      quality: 0.7, // Calidad de la imagen comprimida
    });

    // Si el usuario seleccionó una imagen correctamente, guardar la URI local
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setAvatarUrl(result.assets[0].uri);
    }
  };

  // Función para guardar o actualizar el perfil en la base de datos
  const handleSave = async () => {
    setLoading(true); // Activar indicador de carga
    setErrorMsg(''); // Limpiar mensajes de error

    try {
      // Obtener el usuario autenticado actual desde Supabase
      const { data: { user } } = await supabase.auth.getUser();

      let uploadedUrl = avatarUrl; // Inicialmente usar la URL local o pública existente

      // Si el avatar es un archivo local (no URL pública), subirlo a Supabase Storage
      if (avatarUrl && avatarUrl.startsWith('file')) {
        const fileExt = avatarUrl.split('.').pop(); // Obtener la extensión del archivo
        const fileName = `${user.id}.${fileExt}`; // Nombre único basado en el id del usuario
        const file = {
          uri: avatarUrl,
          name: fileName,
          type: 'image/' + fileExt,
        };

        // Subir el archivo al bucket 'avatars' con sobreescritura permitida (upsert)
        let { data, error } = await supabase.storage
          .from('avatars')
          .upload(fileName, file, { upsert: true, contentType: file.type });

        if (error) throw error; // Lanzar error si falla la subida

        // Obtener la URL pública para poder mostrar el avatar desde cualquier lugar
        const { data: publicUrlData } = supabase
          .storage
          .from('avatars')
          .getPublicUrl(fileName);

        uploadedUrl = publicUrlData.publicUrl; // Actualizar URL a la pública
      }

      // Verificar si el usuario ya existe en la tabla 'users'
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('id', user.id)
        .single();

      if (existingUser) {
        // Si el usuario existe, actualizar sus datos
        const { error } = await supabase
          .from('users')
          .update({
            username, // Nombre de usuario actualizado
            email: user.email, // Email actual del usuario (no editable aquí)
            bio, // Biografía actualizada
            avatar_url: uploadedUrl, // URL del avatar (pública o local)
          })
          .eq('id', user.id); // Condición para el UPDATE

        if (error) {
          setErrorMsg(error.message); // Mostrar mensaje de error si falla
        } else {
          Alert.alert('¡Perfil actualizado!', 'Tu perfil ha sido actualizado.'); // Mensaje de éxito
          navigation.replace('Inicio'); // Navegar a pantalla de inicio reemplazando la pila
        }
      } else {
        // Si el usuario no existe, insertar nuevo registro en 'users'
        const { error } = await supabase
          .from('users')
          .insert([{
            id: user.id, // ID único del usuario
            username, // Nombre de usuario
            email: user.email, // Email del usuario
            bio, // Biografía
            avatar_url: uploadedUrl, // URL del avatar
          }]);

        if (error) {
          setErrorMsg(error.message); // Mostrar error si falla el insert
        } else {
          // No navegamos manualmente aquí para evitar problemas con la detección del perfil
          // En cambio, forzamos recarga de la app para detectar el nuevo perfil
          if (typeof window !== 'undefined') {
            window.location.reload();
          }
        }
      }
    } catch (err) {
      setErrorMsg('Error al guardar el perfil.'); // Mensaje genérico si falla algo en el try
    }
    setLoading(false); // Desactivar indicador de carga
    console.log('Insert/Update perfil terminado'); // Debug en consola
  };

  console.log('Renderizando CompleteProfileScreen'); // Debug en consola cada renderizado

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Completa tu perfil</Text>
      
      {/* Input para nombre de usuario */}
      <TextInput
        style={styles.input}
        placeholder="Nombre de usuario"
        value={username}
        onChangeText={setUsername}
      />

      {/* Input para biografía, con multilinea */}
      <TextInput
        style={styles.input}
        placeholder="Biografía (opcional)"
        value={bio}
        onChangeText={setBio}
        multiline
      />

      {/* Botón para seleccionar o cambiar avatar */}
      <TouchableOpacity style={styles.avatarButton} onPress={pickAvatar}>
        <Text style={styles.avatarButtonText}>
          {avatarUrl ? 'Cambiar avatar' : 'Seleccionar avatar'}
        </Text>
      </TouchableOpacity>

      {/* Mostrar avatar si hay una URL */}
      {avatarUrl ? (
        <Image source={{ uri: avatarUrl }} style={styles.avatar} />
      ) : null}

      {/* Mostrar mensaje de error si hay */}
      {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}

      {/* Botón para guardar perfil, deshabilitado si carga o no hay nombre */}
      <TouchableOpacity style={styles.button} onPress={handleSave} disabled={loading || !username}>
        <Text style={styles.buttonText}>Guardar perfil</Text>
      </TouchableOpacity>
    </View>
  );
}

// Estilos para los componentes de la pantalla
const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#f9fafb' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 24, color: '#6366F1', textAlign: 'center' },
  input: {
    backgroundColor: '#fff', padding: 12, borderRadius: 8, marginBottom: 16,
    borderWidth: 1, borderColor: '#e5e7eb', fontSize: 16,
  },
  avatarButton: {
    backgroundColor: '#6366F1', padding: 10, borderRadius: 8, alignItems: 'center', marginBottom: 12,
  },
  avatarButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  avatar: { width: 80, height: 80, borderRadius: 40, alignSelf: 'center', marginBottom: 16 },
  button: {
    backgroundColor: '#6366F1', padding: 14, borderRadius: 8, alignItems: 'center', marginBottom: 12,
  },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  errorText: {
    color: '#EF4444',
    marginBottom: 12,
    textAlign: 'center',
    fontSize: 14,
  },
});
