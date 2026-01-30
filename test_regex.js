const url = "https://drive.google.com/file/d/1JFEGfEOrGRx8rMEOD48lAKvafr9PJr9I/view?usp=drivesdk";
const fileIdMatch = url.match(/\/d\/(.*?)\/|\/d\/(.*?)$/);
const fileId = fileIdMatch ? (fileIdMatch[1] || fileIdMatch[2]) : null;
console.log("Extracted ID:", fileId);
