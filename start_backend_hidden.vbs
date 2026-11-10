Set WshShell = CreateObject("WScript.Shell")

Set FSO = CreateObject("Scripting.FileSystemObject")

projectPath = FSO.GetParentFolderName(WScript.ScriptFullName)

WshShell.Run """" & projectPath & "\start_backend.bat" & """", 0, False