var fJS;
jQuery(document).ready(function($) {

      
  $(function () {


    // Récupération des données avec Gselper

    var donnees = new Array();

    // Création de l'instance de Gselper
    var doc = new Gselper({

        // Identifiant du document
        key: "0Arq4Yd5BuHnXdDcwTkhSVzN2YTFHR09XSGpjU2hpNXc",
        // Le worksheet du document
        worksheet: "od6",

        // La fonction à appeler lorsque le document est chargé
        onComplete: function(data) {

            // Ici faites ce qu'il vous chante
            // Par exemple, afficher dans la console le contenu de la première case
            

            // Ou parcourir le document ligne après ligne
            $.each(doc.get(), function(i, line) {
              // console.log(line)
                donnees.push(

                {
                  ville: line.ville,
                  insee: Number(line.codeinsee),
                  latitude: Number(line.latitude),
                  longitude: Number(line.longitude),
                  emprunts2008: Number(line.empruntstoxiquesfin2008.replace(/,/g, '.')),
                  emprunts2013: Number(line.empruntstoxiquesfin2013.replace(/,/g, '.')),
                  dette2008: Number(line.montanttotaldeladettefin2008.replace(/,/g, '.')),
                  dette2013: Number(line.montanttotaldeladettefin2013.replace(/,/g, '.')),
                  pourcentage2008: Number(line.pourcentagedutotaldeladettefin2008.replace(/,/g, '.')),
                  pourcentage2013: Number(line.pourcentagedutotaldeladettefin2013.replace(/,/g, '.')),
                  annuite: Number(line.annuitédeladetteparhabitanten2012.replace(/,/g, '.')),
                  texte: line.texte, 
                  reponse: line.reponse,
                  source1: line.source1,
                  source1b: line.source1b,
                  source2: line.source2,
                  source2b: line.source2b,
                  source3: line.source3,
                  source3b: line.source3b  
                })
            });
            console.log(donnees)


            googleMap.init(donnees);
             
        }
    });
      

  });


});






var googleMap = {
        latlng: [46.9833,1.54735],
        zoom: 6,
        markers: {},
        map: null,
        

        init: function(donnees) {

                

                  var mapOptions = {
                    zoom: googleMap.zoom,
                    minZoom: 6,
                    maxZoom:12,
                    center: new google.maps.LatLng(this.latlng[0], this.latlng[1]),
                    mapTypeControlOptions: false,
                    mapTypeId: google.maps.MapTypeId.ROADMAP,
                    mapTypeControl: false,
                    draggable: true,
                    panControl: false,
                    scrollwheel: true,
                    zoomControl: true,
                    streetViewControl: false,
                    disableDoubleClickZoom: false,
                    styles: [
                       {"featureType":"road",
                       "elementType":"geometry",
                       "stylers":[{"visibility":"off"}]},
                       {
                        "featureType": "administrative.country",
                        "elementType": "labels",
                        "stylers": [
                          { "visibility": "off" }
                        ]
                      },
                       {"featureType":"poi",
                       "elementType":"geometry",
                       "stylers":[{"visibility":"off"}]},
                        {"featureType":"poi",
                       "elementType":"labels",
                       "stylers":[{"visibility":"off"}]},
                       {"featureType":"landscape","elementType":"geometry","stylers":[{"color":"#e3dcdc"}]},
                       {"featureType":"water","stylers":[{"lightness":50}]},
                       {"featureType":"road","elementType":"labels","stylers":[{"visibility":"off"}]},
                       {"featureType":"transit","stylers":[{"visibility":"off"}]}
                       // {"featureType":"administrative","elementType":"labels","stylers":[{"visibility":"on"}]}
                    ]
                  };
                  var map2Options = {
                    zoom: 9,
                    minZoom: 2,
                    maxZoom:12,
                    center: new google.maps.LatLng(48.914155, 2.21533),
                    mapTypeControlOptions: false,
                    mapTypeId: google.maps.MapTypeId.ROADMAP,
                    mapTypeControl: false,
                    draggable: true,
                    panControl: false,
                    scrollwheel: true,
                    zoomControl: false,
                    // zoomControlOptions: {
                    //   style: google.maps.ZoomControlStyle.SMALL
                    // },
                    streetViewControl: false,
                    disableDoubleClickZoom: false,
                    styles: [
                       {"featureType":"road",
                       "elementType":"geometry",
                       "stylers":[{"visibility":"off"}]},
                       {"featureType":"poi",
                       "elementType":"geometry",
                       "stylers":[{"visibility":"off"}]},
                        {"featureType":"poi",
                       "elementType":"labels",
                       "stylers":[{"visibility":"off"}]},
                       {"featureType":"landscape","elementType":"geometry","stylers":[{"color":"#e3dcdc"}]},
                       {"featureType":"water","stylers":[{"lightness":50}]},
                       {"featureType":"road","elementType":"labels","stylers":[{"visibility":"off"}]},
                       {"featureType":"transit","stylers":[{"visibility":"off"}]},
                       {"featureType":"administrative","elementType":"labels","stylers":[{"visibility":"on"}]}
                    ]
                  };

          this.map = new google.maps.Map(document.getElementById("carte"),mapOptions);
          this.map2 = new google.maps.Map(document.getElementById("carte2"),map2Options);
          
          $.each(donnees, function(index,data) {
               googleMap.addMarker(data,1);
               googleMap.addMarker(data,2);
          })

          
         
    },

    addMarker: function(donnee,carte) {
          

                    longit = donnee['longitude'];
                    latit = donnee['latitude'];
                    ville = donnee['ville'];

                    var evolpourcentage = Math.round((donnee.pourcentage2013-donnee.pourcentage2008)*100)/100;
                    if(evolpourcentage > 0) {
                      evolpourcentage = "+"+evolpourcentage;
                    }
                    var evolemprunts= Math.round((donnee.emprunts2013-donnee.emprunts2008)*10000/donnee.emprunts2008)/100;
                   if(evolemprunts > 0) {
                      evolemprunts = "+"+evolemprunts;
                    }
                    var evoldette = Math.round((donnee.dette2013-donnee.dette2008)*10000/donnee.dette2008)/100;
                    if(evoldette> 0) {
                      evoldette = "+"+evoldette;
                    }


                    var valeur = Number(donnee.pourcentage2013-donnee.pourcentage2008);
                    
                    

                    var maClasse = "labels Greens q";

                    if(valeur > 0) {
                      maClasse += "9-9";
                    }
                    else if (valeur > -0) {
                      maClasse += "2-9";
                    }
                    else if (valeur > -10) {
                      maClasse += "3-9";
                    }
                    else if (valeur > -20) {
                      maClasse += "4-9";
                    }
                    else if (valeur > -30) {
                      maClasse += "5-9";
                    }
                    else if (valeur > -40) {
                      maClasse += "6-9";
                    }
                    else if (valeur > -50) {
                      maClasse += "7-9";
                    }
                    else if (valeur > -60) {
                      maClasse += "8-9";
                    }
                    else {
                      maClasse += "8-9";
                    }
                   
                        


                    var valeuraffiche = Math.round(valeur);
               
                    
                    if(valeuraffiche > 0) {
                      valeuraffiche = "+"+valeuraffiche;
                    }
                    // valeuraffiche = valeuraffiche+"%";
                   
                   valeurInfowindow = Math.round(valeur*10)/10;
                   if(valeurInfowindow > 0) {
                      valeurInfowindow = "+"+valeurInfowindow;
                    };

                   
                   if(carte == 1) {
                    var lacarte = this.map;
                   } 
                   if(carte == 2) {
                    var lacarte = this.map2;
                   } 

                   var marker = new MarkerWithLabel({
                     position: new google.maps.LatLng(latit,longit),
                     draggable: false,
                     raiseOnDrag: false,
                     map: lacarte,
                     labelContent: "<svg width=\"36\"><circle r=\"18\" cx=\"18\" cy=\"18\"></circle><text class=\"chiffre\" x=\"17\" y=\"22\" id=\"text"+ville+"\" text-anchor=\"middle\">"+valeuraffiche+"</text></svg>",
                     labelAnchor: new google.maps.Point(0, -20),
                     labelClass: maClasse, // the CSS class for the label
                     labelStyle: {opacity: 1},
                     icon: {}
                   });

                
                    
                    var notule = "<p class=\"tt3_capital\">"+donnee.ville+"</p><p>"+donnee.texte+"</p><table cellpadding=\"5\" class=\"bordures mgb16\"><thead><tr><th></th><th>2008</th>      <th>2013</th><th>Evolution</th></tr>  </thead>  <tbody>    <tr>      <td>Part des emprunts toxiques dans la dette</td>      <td>"+donnee.pourcentage2008+"&nbsp;%</td>      <td>"+donnee.pourcentage2013+"&nbsp;%</td><td class=\"evol\">"+evolpourcentage+"&nbsp;points</td>    </tr>    <tr>      <td>Montant des emprunts toxiques (millions d'euros)</td>      <td>"+donnee.emprunts2008+"</td>      <td>"+donnee.emprunts2013+"</td><td class=\"evol\">"+evolemprunts+" %</td>    </tr>    <tr>      <td>Montant total de la dette (millions d'euros)</td>      <td>"+donnee.dette2008+"</td>      <td>"+donnee.dette2013+"</td><td class=\"evol\">"+evoldette+" %</td>    </tr>    <tr>      <td>Annuité de la dette par habitant en 2012</td>      <td colspan=\"3\">"+donnee.annuite+" €</td>    </tr>  </tbody></table>";
                    if(donnee.source1) {
                      notule += "<p><strong class=\"mgb16\">Source(s) :</p><ul class=\"liste_chevron lien_ancres\"><li><a href=\""+donnee.source1+"\" target=\"_blank\">"+donnee.source1b+"</a></li>";
                       if(donnee.source2) {
                          notule += "<li><a href=\""+donnee.source2+"\" target=\"_blank\">"+donnee.source2b+"</a></li>";
                       }
                       if(donnee.source3) {
                          notule += "<li><a href=\""+donnee.source3+"\" target=\"_blank\">"+donnee.source3b+"</a></li>";
                       }
                       notule += "</ul>";
                    }



                    var infowindow = new google.maps.InfoWindow({
                        content: "<div class=\"infofirefox\"><p align=\"center\" class=\"tt4_capital\">"+donnee['ville']+"</p><p align=\"center\"><strong>"+valeurInfowindow+"&nbsp;points</strong></p></div>",
                        pixelOffset: new google.maps.Size(0, -18)
                    });

                    
                    google.maps.event.addListener(marker, 'mouseover', function() {
                      infowindow.open(this.map,marker);
                    });
                     google.maps.event.addListener(marker, 'mouseout', function() {
                      infowindow.close(this.map,marker);
                    });


                    this.markers[donnee.id] = marker;

                    google.maps.event.addListener(marker, 'click', function() {
                        $("#notule").html(notule);
                    });

                    // if(donnee.reponse == "documents fournis par la mairie") {
                    //   marker.setIcon(new google.maps.MarkerImage('img/rouge.png',new google.maps.Size(16,16),new google.maps.Point(0,0)));
                    // }
                    // else if(donnee.reponse == "pas de réponse de la mairie") {
                    //   marker.setIcon(new google.maps.MarkerImage('img/orange.png',new google.maps.Size(16,16),new google.maps.Point(0,0)));
                    // }
                    // else if(donnee.reponse == "documents incomplets fournis par la mairie") {
                    //   marker.setIcon(new google.maps.MarkerImage('img/vert.png',new google.maps.Size(16,16),new google.maps.Point(0,0)));
                    // }


                    return marker;
      },


      // updateMarkers: function(filtering_result,donnees){
        
      //                 var google_map = this;
      //                 var bounds = new google.maps.LatLngBounds();
                      
      //                 this.map.setZoom(googleMap.zoom);
                      
      //                 $.each(google_map.markers, function(){ 
      //                   this.setMap(null);
                        
      //                    })
      //                 $.each(filtering_result, function(i, id){
   
      //                   loc = new google.maps.LatLng(google_map.markers[id].position.d,google_map.markers[id].position.e);
      //                   bounds.extend(loc);
                        
      //                   google_map.markers[id].setMap(google_map.map);
      //                 });

      //                 if(filtering_result.length) {
      //                     if(filtering_result.length == donnees.length) { // Si le champ de recherche est vide
      //                       google_map.reCentrer(); }
      //                     else { 
      //                       google_map.setCenterPoint(); 
      //                       this.map.fitBounds(bounds);
      //                       this.map.panToBounds(bounds);

      //                     }
      //                 }

      //                 $.each(filtering_result,function(i, id){
                         
      //                     if(i%2 == 0) {
      //                       $("#fjs_"+id).removeClass("impair pair").addClass("impair");
      //                     }
      //                     else {
                            
      //                       $("#fjs_"+id).removeClass("impair pair").addClass("pair");
      //                     }
                         
                          
      //                 });
      // },

      // setCenterPoint: function(){
      //   var lat = 0, lng = 0; count = 0;

      //   //Calculate approximate center point.
      //   for(id in this.markers){
      //     var m = this.markers[id];

      //     if(m.map){
      //       lat += m.getPosition().lat();
      //       lng += m.getPosition().lng();
      //       count++;
      //     }

      //   }
        

      //   if(count > 0){
      //     if(count == 1) { 
      //       this.map.setZoom(9);
      //       // this.map.styles[0]["stylers"][0]["visibility"] = "on";
      //      } else { this.map.setZoom(googleMap.zoom) }
      //     this.map.setCenter(new google.maps.LatLng(lat/count,lng/count));
      //   }
      // },

      // reCentrer: function(){
      //   this.map.setCenter(new google.maps.LatLng(googleMap.latlng[0],googleMap.latlng[1]));

      // },

      outreMer: function(valeur){

        this.map.setCenter(new google.maps.LatLng(valeur[0],valeur[1]));
        this.map.setZoom(valeur[2]);
      }


  }








function tailleIframe()
{
  if (top.location != self.document.location)
    {
      $(window.parent.document).find('.embed').children('iframe').get(0).height=$('body').height()+40;
    }
}