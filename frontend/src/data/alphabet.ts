export interface LetterData {
  letter: string;
  imageUrl: string;
  pronunciation: string;
}

// Abecedario inglés (26 letras), imágenes 1-27 donde 15 era Ñ (se salta)
// 1=A, 2=B, ..., 14=N, 15=Ñ(skip), 16=O, 17=P, 18=Q, 19=R, 20=S,
// 21=T, 22=U, 23=V, 24=W, 25=X, 26=Y, 27=Z
export const ALPHABET: LetterData[] = [
  { letter: 'A', imageUrl: '/signs/A.png',  pronunciation: '/a/' },
  { letter: 'B', imageUrl: '/signs/B.png',  pronunciation: '/bi/' },
  { letter: 'C', imageUrl: '/signs/C.png',  pronunciation: '/si/' },
  { letter: 'D', imageUrl: '/signs/D.png',  pronunciation: '/di/' },
  { letter: 'E', imageUrl: '/signs/E.png',  pronunciation: '/i/' },
  { letter: 'F', imageUrl: '/signs/F.png',  pronunciation: '/ef/' },
  { letter: 'G', imageUrl: '/signs/G.png',  pronunciation: '/yi/' },
  { letter: 'H', imageUrl: '/signs/H.png',  pronunciation: '/eitʃ/' },
  { letter: 'I', imageUrl: '/signs/I.png',  pronunciation: '/ai/' },
  { letter: 'J', imageUrl: '/signs/J.png',  pronunciation: '/yei/' },
  { letter: 'K', imageUrl: '/signs/K.png',  pronunciation: '/kei/' },
  { letter: 'L', imageUrl: '/signs/L.png',  pronunciation: '/el/' },
  { letter: 'M', imageUrl: '/signs/M.png',  pronunciation: '/em/' },
  { letter: 'N', imageUrl: '/signs/N.png',  pronunciation: '/en/' },
  { letter: 'O', imageUrl: '/signs/O.png',  pronunciation: '/ou/' },
  { letter: 'P', imageUrl: '/signs/P.png',  pronunciation: '/pi/' },
  { letter: 'Q', imageUrl: '/signs/Q.png',  pronunciation: '/kiu/' },
  { letter: 'R', imageUrl: '/signs/R.png',  pronunciation: '/ar/' },
  { letter: 'S', imageUrl: '/signs/S.png',  pronunciation: '/es/' },
  { letter: 'T', imageUrl: '/signs/T.png',  pronunciation: '/ti/' },
  { letter: 'U', imageUrl: '/signs/U.png',  pronunciation: '/iu/' },
  { letter: 'V', imageUrl: '/signs/V.png',  pronunciation: '/vi/' },
  { letter: 'W', imageUrl: '/signs/W.png',  pronunciation: '/dabliu/' },
  { letter: 'X', imageUrl: '/signs/X.png',  pronunciation: '/eks/' },
  { letter: 'Y', imageUrl: '/signs/Y.png',  pronunciation: '/wai/' },
  { letter: 'Z', imageUrl: '/signs/Z.png',  pronunciation: '/zi/' },
];
