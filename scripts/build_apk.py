import os
import subprocess
import shutil
import zipfile

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
BUILD_DIR = os.path.join(ROOT_DIR, '.android_build')
DOWNLOADS_DIR = os.path.join(ROOT_DIR, 'public', 'downloads')
KEYSTORE_PATH = os.path.join(ROOT_DIR, 'scripts', 'debug.keystore')
ANDROID_JAR = '/usr/lib/android-sdk/platforms/android-23/android.jar'

os.makedirs(DOWNLOADS_DIR, exist_ok=True)
os.makedirs(BUILD_DIR, exist_ok=True)

# 1. Ensure debug keystore exists
if not os.path.exists(KEYSTORE_PATH):
    print("Generating debug keystore...")
    subprocess.run([
        'keytool', '-genkeypair', '-v',
        '-keystore', KEYSTORE_PATH,
        '-alias', 'androiddebugkey',
        '-keyalg', 'RSA', '-keysize', '2048',
        '-validity', '10000',
        '-storepass', 'android', '-keypass', 'android',
        '-dname', 'CN=CapillaConecta, OU=Comunidad, O=CapillaDelMonte, C=AR'
    ], check=True)

# 2. Setup directory layout
src_dir = os.path.join(BUILD_DIR, 'src', 'ar', 'gov', 'capilladelmonte', 'conecta')
res_dir = os.path.join(BUILD_DIR, 'res')
res_val_dir = os.path.join(res_dir, 'values')
res_hdpi_dir = os.path.join(res_dir, 'mipmap-hdpi')
res_xhdpi_dir = os.path.join(res_dir, 'mipmap-xhdpi')
res_xxhdpi_dir = os.path.join(res_dir, 'mipmap-xxhdpi')
bin_dir = os.path.join(BUILD_DIR, 'bin')
assets_dir = os.path.join(BUILD_DIR, 'assets')
assets_dist_dir = os.path.join(assets_dir, 'dist')

for d in [src_dir, res_val_dir, res_hdpi_dir, res_xhdpi_dir, res_xxhdpi_dir, bin_dir, assets_dist_dir]:
    os.makedirs(d, exist_ok=True)

# Copy icons
icon_192 = os.path.join(ROOT_DIR, 'public', 'pwa-192x192.png')
icon_512 = os.path.join(ROOT_DIR, 'public', 'pwa-512x512.png')
if os.path.exists(icon_192):
    shutil.copy(icon_192, os.path.join(res_hdpi_dir, 'ic_launcher.png'))
    shutil.copy(icon_192, os.path.join(res_xhdpi_dir, 'ic_launcher.png'))
if os.path.exists(icon_512):
    shutil.copy(icon_512, os.path.join(res_xxhdpi_dir, 'ic_launcher.png'))

# Copy web dist assets into assets/dist
dist_dir = os.path.join(ROOT_DIR, 'dist')
if os.path.exists(dist_dir):
    shutil.copytree(dist_dir, assets_dist_dir, dirs_exist_ok=True)

# Write strings.xml
with open(os.path.join(res_val_dir, 'strings.xml'), 'w', encoding='utf-8') as f:
    f.write('''<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">Capilla Conecta</string>
</resources>
''')

# Write AndroidManifest.xml
manifest_path = os.path.join(BUILD_DIR, 'AndroidManifest.xml')
with open(manifest_path, 'w', encoding='utf-8') as f:
    f.write('''<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="ar.gov.capilladelmonte.conecta"
    android:versionCode="1"
    android:versionName="1.0.0">

    <uses-sdk android:minSdkVersion="21" android:targetSdkVersion="33" />

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.VIBRATE" />

    <application
        android:label="@string/app_name"
        android:icon="@mipmap/ic_launcher"
        android:theme="@android:style/Theme.NoTitleBar"
        android:usesCleartextTraffic="true"
        android:hardwareAccelerated="true">

        <activity
            android:name="ar.gov.capilladelmonte.conecta.MainActivity"
            android:label="@string/app_name"
            android:configChanges="orientation|screenSize|keyboardHidden"
            android:windowSoftInputMode="adjustResize"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>
''')

# Write MainActivity.java
main_activity_path = os.path.join(src_dir, 'MainActivity.java')
with open(main_activity_path, 'w', encoding='utf-8') as f:
    f.write('''package ar.gov.capilladelmonte.conecta;

import android.app.Activity;
import android.os.Bundle;
import android.view.View;
import android.view.Window;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.ProgressBar;
import android.widget.RelativeLayout;
import android.widget.Toast;

public class MainActivity extends Activity {
    private WebView webView;
    private ProgressBar progressBar;

    private static final String ONLINE_URL = "https://ais-pre-v3yeffnghbqzf3xhauqokz-663102456098.us-east1.run.app";
    private static final String LOCAL_URL = "file:///android_asset/dist/index.html";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        requestWindowFeature(Window.FEATURE_NO_TITLE);

        RelativeLayout layout = new RelativeLayout(this);

        webView = new WebView(this);
        WebSettings webSettings = webView.getSettings();
        webSettings.setJavaScriptEnabled(true);
        webSettings.setDomStorageEnabled(true);
        webSettings.setDatabaseEnabled(true);
        webSettings.setAllowFileAccess(true);
        webSettings.setAllowContentAccess(true);
        webSettings.setAllowFileAccessFromFileURLs(true);
        webSettings.setAllowUniversalAccessFromFileURLs(true);
        webSettings.setUseWideViewPort(true);
        webSettings.setLoadWithOverviewMode(true);
        webSettings.setSupportZoom(false);
        webSettings.setUserAgentString(webSettings.getUserAgentString() + " CapillaConectaAndroidApp/1.0");

        progressBar = new ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal);
        progressBar.setMax(100);
        RelativeLayout.LayoutParams progressParams = new RelativeLayout.LayoutParams(
            RelativeLayout.LayoutParams.MATCH_PARENT, 8);
        progressParams.addRule(RelativeLayout.ALIGN_PARENT_TOP);
        progressBar.setLayoutParams(progressParams);

        layout.addView(webView, new RelativeLayout.LayoutParams(
            RelativeLayout.LayoutParams.MATCH_PARENT, RelativeLayout.LayoutParams.MATCH_PARENT));
        layout.addView(progressBar);

        setContentView(layout);

        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onProgressChanged(WebView view, int newProgress) {
                if (newProgress < 100) {
                    progressBar.setVisibility(View.VISIBLE);
                    progressBar.setProgress(newProgress);
                } else {
                    progressBar.setVisibility(View.GONE);
                }
            }
        });

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                view.loadUrl(url);
                return true;
            }

            @Override
            public void onReceivedError(WebView view, int errorCode, String description, String failingUrl) {
                if (failingUrl != null && failingUrl.startsWith("http")) {
                    view.loadUrl(LOCAL_URL);
                    Toast.makeText(MainActivity.this, "Cargando versión local de Capilla Conecta...", Toast.LENGTH_SHORT).show();
                }
            }
        });

        webView.loadUrl(ONLINE_URL);
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }
}
''')

# Compile resources with aapt
print("Compiling resources with aapt...")
subprocess.run([
    'aapt', 'package', '-f', '-m',
    '-J', os.path.join(BUILD_DIR, 'src'),
    '-M', manifest_path,
    '-S', res_dir,
    '-I', ANDROID_JAR
], check=True)

# Compile Java code
print("Compiling Java classes...")
subprocess.run([
    'javac', '-source', '8', '-target', '8',
    '-bootclasspath', ANDROID_JAR,
    '-d', bin_dir,
    os.path.join(src_dir, 'R.java'),
    os.path.join(src_dir, 'MainActivity.java')
], check=True)

# Convert classes to classes.dex with dalvik-exchange (dx)
print("Converting classes to DEX...")
dx_tool = 'dalvik-exchange' if shutil.which('dalvik-exchange') else 'dx'
classes_dex = os.path.join(bin_dir, 'classes.dex')
subprocess.run([
    dx_tool, '--dex', f'--output={classes_dex}', bin_dir
], check=True)

# Package into unsigned APK
print("Packaging unsigned APK...")
unsigned_apk = os.path.join(bin_dir, 'app-unsigned.apk')
if os.path.exists(unsigned_apk):
    os.remove(unsigned_apk)

subprocess.run([
    'aapt', 'package', '-f',
    '-M', manifest_path,
    '-S', res_dir,
    '-A', assets_dir,
    '-I', ANDROID_JAR,
    '-F', unsigned_apk
], check=True)

# Add classes.dex into APK root
subprocess.run(['aapt', 'add', unsigned_apk, 'classes.dex'], cwd=bin_dir, check=True)

# Zip-align APK
print("Aligning APK...")
aligned_apk = os.path.join(bin_dir, 'app-aligned.apk')
if os.path.exists(aligned_apk):
    os.remove(aligned_apk)
subprocess.run(['zipalign', '-f', '-p', '4', unsigned_apk, aligned_apk], check=True)

# Sign APK with apksigner
final_apk_path = os.path.join(DOWNLOADS_DIR, 'CapillaConecta.apk')
print("Signing APK with apksigner...")
subprocess.run([
    'apksigner', 'sign',
    '--ks', KEYSTORE_PATH,
    '--ks-key-alias', 'androiddebugkey',
    '--ks-pass', 'pass:android',
    '--key-pass', 'pass:android',
    '--out', final_apk_path,
    aligned_apk
], check=True)

# Verify APK
verify_res = subprocess.run(['apksigner', 'verify', '--verbose', final_apk_path], capture_output=True, text=True)
print("APK Signature Verification:\n", verify_res.stdout)

# Generate complete Android Studio project ZIP
project_zip_path = os.path.join(DOWNLOADS_DIR, 'CapillaConecta-Android-Project.zip')
print("Creating Android Studio source ZIP...")
with zipfile.ZipFile(project_zip_path, 'w', compression=zipfile.ZIP_DEFLATED) as pz:
    pz.writestr('README.md', '# Capilla Conecta - Proyecto Android Nativo\n\nEste proyecto contiene el código fuente completo listo para abrir en Android Studio.\n')
    pz.writestr('app/build.gradle', '''apply plugin: 'com.android.application'

android {
    namespace 'ar.gov.capilladelmonte.conecta'
    compileSdk 33

    defaultConfig {
        applicationId "ar.gov.capilladelmonte.conecta"
        minSdk 21
        targetSdk 33
        versionCode 1
        versionName "1.0.0"
    }

    buildTypes {
        release {
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}
''')
    pz.write(manifest_path, 'app/src/main/AndroidManifest.xml')
    pz.write(main_activity_path, 'app/src/main/java/ar/gov/capilladelmonte/conecta/MainActivity.java')
    pz.write(os.path.join(res_val_dir, 'strings.xml'), 'app/src/main/res/values/strings.xml')
    if os.path.exists(icon_192):
        pz.write(icon_192, 'app/src/main/res/mipmap-hdpi/ic_launcher.png')
        pz.write(icon_192, 'app/src/main/res/mipmap-xhdpi/ic_launcher.png')
    if os.path.exists(icon_512):
        pz.write(icon_512, 'app/src/main/res/mipmap-xxhdpi/ic_launcher.png')

print(f"Build complete! Output APK: {final_apk_path} ({os.path.getsize(final_apk_path)} bytes)")
print(f"Android Studio Project ZIP: {project_zip_path} ({os.path.getsize(project_zip_path)} bytes)")
