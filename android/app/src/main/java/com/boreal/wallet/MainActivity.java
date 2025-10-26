package com.boreal.wallet;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import io.capawesome.capacitorjs.plugins.firebase.authentication.FirebaseAuthenticationPlugin;

public class MainActivity extends BridgeActivity {
	@Override
	public void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);
		// Registro explícito del plugin para evitar NPE por instancia no inicializada
		registerPlugin(FirebaseAuthenticationPlugin.class);
	}
}
