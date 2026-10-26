import fs from 'node:fs/promises';
await fs.rm('pages-dist',{recursive:true,force:true});
await fs.cp('public','pages-dist',{recursive:true});
await fs.writeFile('pages-dist/.nojekyll','');
console.log('Built independent public demo.');
