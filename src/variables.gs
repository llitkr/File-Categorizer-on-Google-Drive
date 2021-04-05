var nameOfConfigFile = 'FileCategorizerConfig';
var suffixForCreatingFolders = '(FC에서 생성)'
var startTime = 0;
var currentTime = 0;
const MAXIMUM_EXE_TIME = 1700;
const EXE_TERM = 5;
var totalNum = 0;
var totalSize = 0;
var exit = 0;

var fileNameToRemove = ['rgtorrent.com.url', `최초배포지 확인 후 시청하기.txt`, 'www.btranking.com.txt','btranking.com.url', `● 미드TV ● 미드.미국드라마 정보공유 커뮤니티 - 미드티비.url`, `토렌트포 바로가기.url`, `필독사항.txt`, `더많은 토렌트자료는 여기서.url`, `토렌트 베이스 토랭크.html`, `최초배포 www.torrentmi.com.txt`];
