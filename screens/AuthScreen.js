// Importamos los hooks y componentes necesarios desde React y React Native
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';

// Importamos nuestra instancia de Supabase
import supabase from '../Services/supabaseClient';

// Componente principal para el inicio de sesión y registro
export default function AuthScreen({ navigation }) {
  // Estados para guardar el correo, contraseña y otros indicadores
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true); // true = login, false = registro
  const [loading, setLoading] = useState(false); // para deshabilitar botón mientras carga
  const [errorMsg, setErrorMsg] = useState(''); // muestra errores al usuario
  const [showConfirmationMsg, setShowConfirmationMsg] = useState(false); // muestra mensaje tras registro

  // Función que gestiona tanto el login como el registro
  const handleAuth = async () => {
    setLoading(true); // Activamos indicador de carga
    setErrorMsg(''); // Reiniciamos error anterior
    setShowConfirmationMsg(false); // Ocultamos mensaje anterior

    if (isLogin) {
      // Si es inicio de sesión
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setErrorMsg(error.message); // Mostramos error si ocurre
      } else {
        navigation.replace('MainTabs'); // Navegamos a la pantalla principal
      }
    } else {
      // Si es registro
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setErrorMsg(error.message); // Mostramos error si ocurre
      } else {
        setShowConfirmationMsg(true); // Mostramos mensaje de confirmación por email
        setIsLogin(true); // Cambiamos a modo login
      }
    }

    setLoading(false); // Terminamos la carga
  };

  return (
    <View style={styles.container}>
      {/* Título que cambia según el modo */}
      <Text style={styles.title}>{isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}</Text>

      {/* Campo para correo electrónico */}
      <TextInput
        style={styles.input}
        placeholder="Correo electrónico"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />

      {/* Campo para contraseña */}
      <TextInput
        style={styles.input}
        placeholder="Contraseña"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      {/* Mensaje de error (si lo hay) */}
      {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}

      {/* Botón de login o registro */}
      <TouchableOpacity style={styles.button} onPress={handleAuth} disabled={loading}>
        <Text style={styles.buttonText}>{isLogin ? 'Entrar' : 'Registrarse'}</Text>
      </TouchableOpacity>

      {/* Mensaje de confirmación después de registrarse */}
      {showConfirmationMsg && (
        <Text style={styles.confirmMsg}>
          Revisa tu correo electrónico y haz clic en el enlace de confirmación para activar tu cuenta.
        </Text>
      )}

      {/* Enlace para cambiar entre login y registro */}
      <TouchableOpacity
        onPress={() => {
          setIsLogin(!isLogin); // Cambia el modo
          setErrorMsg(''); // Limpia errores
          setShowConfirmationMsg(false); // Oculta mensaje anterior
        }}
      >
        <Text style={styles.toggleText}>
          {isLogin ? '¿No tienes cuenta? Crear una' : '¿Ya tienes cuenta? Iniciar sesión'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// Estilos para la pantalla
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#f9fafb', // color de fondo claro
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 24,
    color: '#6366F1', // color azul
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    fontSize: 16,
  },
  button: {
    backgroundColor: '#6366F1',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  toggleText: {
    color: '#6366F1',
    textAlign: 'center',
    marginTop: 8,
  },
  errorText: {
    color: '#EF4444', // rojo
    marginBottom: 12,
    textAlign: 'center',
    fontSize: 14,
  },
  confirmMsg: {
    color: '#6366F1',
    textAlign: 'center',
    marginTop: 12,
    fontSize: 15,
  },
});
