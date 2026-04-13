// Polyfills for crypto and other node modules
import { Buffer } from 'buffer';

if (typeof global !== 'undefined') {
    global.Buffer = Buffer;
}

if (typeof window !== 'undefined') {
    window.Buffer = Buffer;
}