param(
  [ValidateSet('dev', 'build', 'preview', 'typecheck', 'lint', 'test', 'check:release', 'check:publish')]
  [string]$Task = 'dev'
)
# 시스템 설정을 변경하지 않고 이 프로젝트 전용 Node.js를 사용합니다.
$taskWorkspace = Split-Path -Parent $PSScriptRoot
$taskNode = Join-Path $taskWorkspace '.tools\node-v24.21.0-win-x64'
if (-not (Test-Path -LiteralPath (Join-Path $taskNode 'node.exe'))) {
  Write-Error '프로젝트 전용 Node가 없습니다. Node.js LTS 설치 후 npm ci, npm run dev를 실행하세요.'
  exit 1
}
$env:PATH = $taskNode + ';' + $env:PATH
Push-Location -LiteralPath $taskWorkspace
try { & (Join-Path $taskNode 'npm.cmd') run $Task; $taskExitCode = $LASTEXITCODE }
finally { Pop-Location }
exit $taskExitCode
