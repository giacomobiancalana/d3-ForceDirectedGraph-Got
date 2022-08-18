# d3-ForceDirectedGraph-Got
Force Directed graph in html js and css using d3 library

" git clone https://github.com/giacomobiancalana/d3-ForceDirectedGraph-Got.git " per clonare il progetto.
" git push origin main " per pusharlo su github.

## Descrizione
Il progetto consiste in un algoritmo force directed ottenuto tramite la libreria javascript D3.
I vari nodi rappresentano i personaggi di "Game of Thrones" estratti dal file got-graph.graphml.xml, colorati in base alla casata di nascita.
I vari nodi/personaggi sono collegati fra loro con un arco in base alle loro relazioni e/o episodi che li accomunano, 
e non c'è distinzione nel grafo risultante tra archi diretti e indiretti.

C'è una legenda che ci indica la casata in base al colore del nodo, che è sempre visibile sulla parte destra della pagina.
Inoltre, ogni volta che passiamo sopra un nodo con il cursore del mouse, vengono visualizzati il nome del personaggio
relativo e tutte le sue relazioni sulla parte sinistra della pagina.

Per una migliore visualizzazione del grafo, è stato scelto di poterlo spostare per intero a proprio piacimento e di poterlo 
zoomare.