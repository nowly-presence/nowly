; Nowly Host Installer
; Inno Setup script

#define MyAppName "Nowly Host"
#define MyAppPublisher "Nowly"
#define MyAppURL "https://nowly.me"
#define MyAppExeName "nowly-host.exe"
#ifndef APP_VERSION
  #define APP_VERSION "0.0.0"
#endif

#define HostName "nowly.client"
#define InstallFolder "NowlyClient"

[Setup]
AppId={{A1B2C3D4-E5F6-7890-ABCD-EF1234567890}
AppName={#MyAppName}
AppVersion={#APP_VERSION}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
DefaultDirName={localappdata}\{#InstallFolder}
DisableDirPage=no
DefaultGroupName={#MyAppName}
DisableProgramGroupPage=yes
OutputDir=dist
OutputBaseFilename=NowlySetup
SetupIconFile=installer.ico
WizardStyle=modern
WizardImageFile=assets\banner.png
WizardSmallImageFile=assets\icon.png
DisableWelcomePage=no
UninstallDisplayIcon={app}\installer.ico
Compression=lzma2/max
SolidCompression=yes
PrivilegesRequired=none
ArchitecturesInstallIn64BitMode=x64compatible
MinVersion=10.0

[Languages]
Name: "en"; MessagesFile: "compiler:Default.isl"
Name: "fr"; MessagesFile: "compiler:Languages\French.isl"

[Files]
Source: "dist\nowly-host.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "installer.ico"; DestDir: "{app}"; Flags: ignoreversion

[Registry]
Root: HKCU; Subkey: "Software\Google\Chrome\NativeMessagingHosts\{#HostName}"; ValueType: string; ValueData: "{app}\{#HostName}.json"; Flags: uninsdeletekey
Root: HKCU; Subkey: "Software\Microsoft\Edge\NativeMessagingHosts\{#HostName}"; ValueType: string; ValueData: "{app}\{#HostName}.json"; Flags: uninsdeletekey
Root: HKCU; Subkey: "Software\BraveSoftware\Brave-Browser\NativeMessagingHosts\{#HostName}"; ValueType: string; ValueData: "{app}\{#HostName}.json"; Flags: uninsdeletekey
; Opera and Opera GX do not read the Chrome key: each reads its own browser-specific key
Root: HKCU; Subkey: "Software\Opera Software\NativeMessagingHosts\{#HostName}"; ValueType: string; ValueData: "{app}\{#HostName}.json"; Flags: uninsdeletekey
Root: HKCU; Subkey: "Software\Opera Software\Opera Stable\NativeMessagingHosts\{#HostName}"; ValueType: string; ValueData: "{app}\{#HostName}.json"; Flags: uninsdeletekey
Root: HKCU; Subkey: "Software\Opera Software\Opera GX Stable\NativeMessagingHosts\{#HostName}"; ValueType: string; ValueData: "{app}\{#HostName}.json"; Flags: uninsdeletekey
; Firefox uses a separate registry key and a manifest with allowed_extensions instead of allowed_origins
Root: HKCU; Subkey: "Software\Mozilla\NativeMessagingHosts\{#HostName}"; ValueType: string; ValueData: "{app}\{#HostName}-firefox.json"; Flags: uninsdeletekey

[Run]
Filename: "powershell.exe"; Parameters: "-Command ""Add-MpPreference -ExclusionPath '{app}' -ErrorAction SilentlyContinue"""; Flags: runhidden; Description: "Add Defender exclusion"; Check: IsDefaultDir

; The manifests are written by [Code], so the uninstaller does not track them
[UninstallDelete]
Type: files; Name: "{app}\{#HostName}.json"
Type: files; Name: "{app}\{#HostName}-firefox.json"

[UninstallRun]
Filename: "taskkill.exe"; Parameters: "/f /im nowly-host.exe"; Flags: runhidden
Filename: "powershell.exe"; Parameters: "-Command ""Remove-MpPreference -ExclusionPath '{app}' -ErrorAction SilentlyContinue"""; Flags: runhidden

[Code]

// A Defender exclusion must never cover a folder picked by the user
function IsDefaultDir: Boolean;
begin
  Result := CompareText(ExpandConstant('{app}'), ExpandConstant('{localappdata}\{#InstallFolder}')) = 0;
end;

procedure CurStepChanged(CurStep: TSetupStep);
var
  ManifestPath: string;
  HostPath: string;
  Manifest: string;
  FirefoxManifestPath: string;
  FirefoxManifest: string;
begin
  if CurStep = ssPostInstall then
  begin
    ManifestPath := ExpandConstant('{app}\{#HostName}.json');
    HostPath := ExpandConstant('{app}\{#MyAppExeName}');
    StringChange(HostPath, '\', '\\');

    Manifest :=
      '{' + #13#10 +
      '  "name": "{#HostName}",' + #13#10 +
      '  "description": "Nowly Native Messaging Host",' + #13#10 +
      '  "path": "' + HostPath + '",' + #13#10 +
      '  "type": "stdio",' + #13#10 +
      '  "allowed_origins": [' + #13#10 +
      '    "chrome-extension://kmnlnfldimgneaopdihplkebobckcjpf/",' + #13#10 +
      '    "chrome-extension://abbegmindbabanjcabnmcjmamaoffbam/"' + #13#10 +
      '  ]' + #13#10 +
      '}';

    SaveStringsToUTF8FileWithoutBOM(ManifestPath, [Manifest], False);

    // Firefox manifest — uses allowed_extensions instead of allowed_origins.
    // Dev UUID is derived from the Chrome dev ID; prod ID is the AMO gecko.id.
    FirefoxManifestPath := ExpandConstant('{app}\{#HostName}-firefox.json');
    FirefoxManifest :=
      '{' + #13#10 +
      '  "name": "{#HostName}",' + #13#10 +
      '  "description": "Nowly Native Messaging Host",' + #13#10 +
      '  "path": "' + HostPath + '",' + #13#10 +
      '  "type": "stdio",' + #13#10 +
      '  "allowed_extensions": [' + #13#10 +
      '    "{01146c8d-3101-0d92-01dc-29c0c0e5510c}",' + #13#10 +
      '    "nowly@nowly.me"' + #13#10 +
      '  ]' + #13#10 +
      '}';

    SaveStringsToUTF8FileWithoutBOM(FirefoxManifestPath, [FirefoxManifest], False);
  end;
end;
