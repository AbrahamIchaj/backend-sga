import { Injectable, Logger } from '@nestjs/common';
import * as argon2 from 'argon2';

@Injectable()
export class HashService {
  private readonly logger = new Logger(HashService.name);

  private readonly argonConfig = {
    type: argon2.argon2id,
    
    // Configuración optimizada para servidores con recursos limitados
    memoryCost: 2 ** 16, // 64 MB (65536 KB)
    timeCost: 3,  
    parallelism: 1,
    hashLength: 32,
  };


  async hashPassword(password: string): Promise<string> {
    try {
      const startTime = Date.now();
      
      // Validar entrada
      if (!password || typeof password !== 'string') {
        throw new Error('La contraseña debe ser una cadena no vacía');
      }

      if (password.length < 6) {
        throw new Error('La contraseña debe tener al menos 6 caracteres');
      }

      if (password.length > 128) {
        throw new Error('La contraseña es demasiado larga (máx 128 caracteres)');
      }

      // Hashear con Argon2id
      const hash = await argon2.hash(password, this.argonConfig);
      
      const duration = Date.now() - startTime;
      this.logger.log(`Contraseña hasheada exitosamente en ${duration}ms`);

      return hash;
    } catch (error) {
      this.logger.error(`Error al hashear contraseña: ${error.message}`);
      throw new Error(`Error al hashear contraseña: ${error.message}`);
    }
  }


  // Verifica si una contraseña coincide con su hash
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    try {
      const startTime = Date.now();
      
      // Validar entradas
      if (!password || !hash) {
        return false;
      }

      if (typeof password !== 'string' || typeof hash !== 'string') {
        return false;
      }

      const isValid = await argon2.verify(hash, password);
      
      const duration = Date.now() - startTime;
      this.logger.log(`Verificación de contraseña completada en ${duration}ms: ${isValid ? 'VÁLIDA' : 'INVALIDA'}`);

      return isValid;
    } catch (error) {
      this.logger.error(`Error al verificar contraseña: ${error.message}`);
      return false;
    }
  }

//Generar contraseña segura temporal
  generateTemporaryPassword(length: number = 12): string {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    
    // Asegurar al menos un carácter de cada tipo
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*';
    
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += symbols[Math.floor(Math.random() * symbols.length)];
    
    // Completar la longitud restante
    for (let i = password.length; i < length; i++) {
      password += charset[Math.floor(Math.random() * charset.length)];
    }
    
    // Mezclar los caracteres
    const temporaryPassword = password.split('').sort(() => Math.random() - 0.5).join('');
    
    this.logger.warn(`⚠️ CONTRASEÑA TEMPORAL GENERADA - Esta información es sensible`);
    return temporaryPassword;
  }

//Calculo de fecha de expiración por defecto 24 horas
  getTemporaryPasswordExpiration(): Date {
    const expiration = new Date();
    expiration.setHours(expiration.getHours() + 24);
    return expiration;
  }

  // Verifica si una contraseña temporal ha expirado
  isTemporaryPasswordExpired(fechaExpiracion: Date): boolean {
    return new Date() > fechaExpiracion;
  }

  // Valida la fortaleza de una contraseña
  validatePasswordStrength(password: string): {
    isValid: boolean;
    score: number;
    feedback: string[];
  } {
    const feedback: string[] = [];
    let score = 0;

    if (!password) {
      return {
        isValid: false,
        score: 0,
        feedback: ['La contraseña es requerida']
      };
    }

    // Longitud mínima
    if (password.length >= 8) {
      score += 20;
    } else {
      feedback.push('La contraseña debe tener al menos 8 caracteres');
    }

    // Letras minúsculas
    if (/[a-z]/.test(password)) {
      score += 20;
    } else {
      feedback.push('La contraseña debe contener letras minúsculas');
    }

    // Letras mayúsculas
    if (/[A-Z]/.test(password)) {
      score += 20;
    } else {
      feedback.push('La contraseña debe contener letras mayúsculas');
    }

    // Números
    if (/\d/.test(password)) {
      score += 20;
    } else {
      feedback.push('La contraseña debe contener números');
    }

    // Símbolos especiales
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      score += 20;
    } else {
      feedback.push('La contraseña debe contener caracteres especiales');
    }

    // Longitud extra
    if (password.length >= 12) {
      score += 10;
    }

    // Diversidad de caracteres
    if (new Set(password).size >= password.length * 0.6) {
      score += 10;
    }

    return {
      isValid: score >= 80,
      score: Math.min(score, 100),
      feedback: feedback.length > 0 ? feedback : ['Strong password']
    };
  }

//Mostrar info de config de argon2
  getHashInfo(): object {
    return {
      algorithm: 'Argon2id',
      memoryCost: `${this.argonConfig.memoryCost / 1024} KB`,
      timeCost: this.argonConfig.timeCost,
      parallelism: this.argonConfig.parallelism,
      hashLength: this.argonConfig.hashLength,
      estimatedMemoryUsage: `~${(this.argonConfig.memoryCost / 1024).toFixed(1)} MB por hash`,
      securityLevel: 'High (optimized for limited resources)'
    };
  }
}
