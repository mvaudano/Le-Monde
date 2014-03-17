var fJS;
jQuery(document).ready(function($) {

      
  $(function () {


    // Récupération des données avec Gselper

    var donnees = new Array();

    // Création de l'instance de Gselper
    var doc = new Gselper({

        // Identifiant du document
        key: "0Am-p0HapAZ5jdERjXzVhaTFEcU83Y0l3Vng3QUh6M0E",
        worksheet: "od6",

        // La fonction à appeler lorsque le document est chargé
        onComplete: function(data) {

            // Ici faites ce qu'il vous chante
            // Par exemple, afficher dans la console le contenu de la première case
            

            // Ou parcourir le document ligne après ligne
            $.each(doc.get(), function(i, line) {
       
                donnees.push({ 
                            ville: line.ville,
                            latitude: Number(line.latitude),
                            longitude: Number(line.longitude),
                            date: line.date,
                            notule: line.notule,
                            couleuractuelle: line["couleuractuelle"],
                            tour: line["tour"],
                            lien: line["lien"],
                            cas: {
                                  cas1: {
                                        id: 1,
                                        cas: line["cas1"],
                                        candidats: {
                                            candidat1:{
                                              nom: line["cas1-candidat1-nom"],
                                              parti: line["cas1-candidat1-parti"],
                                              score: Number(line["cas1-candidat1-score"])
                                            },
                                            candidat2:{
                                              nom: line["cas1-candidat2-nom"],
                                              parti: line["cas1-candidat2-parti"],
                                              score: Number(line["cas1-candidat2-score"])
                                            },
                                            candidat3:{
                                              nom: line["cas1-candidat3-nom"],
                                              parti: line["cas1-candidat3-parti"],
                                              score: Number(line["cas1-candidat3-score"])
                                            },
                                            candidat4:{
                                              nom: line["cas1-candidat4-nom"],
                                              parti: line["cas1-candidat4-parti"],
                                              score: Number(line["cas1-candidat4-score"])
                                            },
                                            candidat5:{
                                              nom: line["cas1-candidat5-nom"],
                                              parti: line["cas1-candidat5-parti"],
                                              score: Number(line["cas1-candidat5-score"])
                                            }
                                      }
                                    },

                                    cas2: {
                                        id: 2,
                                        cas: line["cas2"],
                                        candidats: {
                                            candidat1:{
                                              nom: line["cas2-candidat1-nom"],
                                              parti: line["cas2-candidat1-parti"],
                                              score: Number(line["cas2-candidat1-score"])
                                            },
                                            candidat2:{
                                              nom: line["cas2-candidat2-nom"],
                                              parti: line["cas2-candidat2-parti"],
                                              score: Number(line["cas2-candidat2-score"])
                                            },
                                            candidat3:{
                                              nom: line["cas2-candidat3-nom"],
                                              parti: line["cas2-candidat3-parti"],
                                              score: Number(line["cas2-candidat3-score"])
                                            },
                                            candidat4:{
                                              nom: line["cas2-candidat4-nom"],
                                              parti: line["cas2-candidat4-parti"],
                                              score: Number(line["cas2-candidat4-score"])
                                            },
                                            candidat5:{
                                              nom: line["cas2-candidat5-nom"],
                                              parti: line["cas2-candidat5-parti"],
                                              score: Number(line["cas2-candidat5-score"])
                                            }
                                        }
                                    },

                                    cas3:{
                                        id: 3,
                                        cas: line["cas3"],
                                        candidats: {
                                            candidat1:{
                                              nom: line["cas3-candidat1-nom"],
                                              parti: line["cas3-candidat1-parti"],
                                              score: Number(line["cas3-candidat1-score"])
                                            },
                                            candidat2:{
                                              nom: line["cas3-candidat2-nom"],
                                              parti: line["cas3-candidat2-parti"],
                                              score: Number(line["cas3-candidat2-score"])
                                            },
                                            candidat3:{
                                              nom: line["cas3-candidat3-nom"],
                                              parti: line["cas3-candidat3-parti"],
                                              score: Number(line["cas3-candidat3-score"])
                                            },
                                            candidat4:{
                                              nom: line["cas3-candidat4-nom"],
                                              parti: line["cas3-candidat4-parti"],
                                              score: Number(line["cas3-candidat4-score"])
                                            },
                                            candidat5:{
                                              nom: line["cas3-candidat5-nom"],
                                              parti: line["cas3-candidat5-parti"],
                                              score: Number(line["cas3-candidat5-score"])
                                            }
                                        }
                                    },
                                    cas4:{
                                        id: 3,
                                        cas: line["cas4"],
                                        candidats: {
                                            candidat1:{
                                              nom: line["cas4-candidat1-nom"],
                                              parti: line["cas4-candidat1-parti"],
                                              score: Number(line["cas4-candidat1-score"])
                                            },
                                            candidat2:{
                                              nom: line["cas4-candidat2-nom"],
                                              parti: line["cas4-candidat2-parti"],
                                              score: Number(line["cas4-candidat2-score"])
                                            },
                                            candidat3:{
                                              nom: line["cas4-candidat3-nom"],
                                              parti: line["cas4-candidat3-parti"],
                                              score: Number(line["cas4-candidat3-score"])
                                            },
                                            candidat4:{
                                              nom: line["cas4-candidat4-nom"],
                                              parti: line["cas4-candidat4-parti"],
                                              score: Number(line["cas4-candidat4-score"])
                                            },
                                            candidat5:{
                                              nom: line["cas4-candidat5-nom"],
                                              parti: line["cas4-candidat5-parti"],
                                              score: Number(line["cas4-candidat5-score"])
                                            }
                                        }
                                    },
                                    cas5:{
                                        id: 4,
                                        cas: line["cas5"],
                                        candidats: {
                                            candidat1:{
                                              nom: line["cas5-candidat1-nom"],
                                              parti: line["cas5-candidat1-parti"],
                                              score: Number(line["cas5-candidat1-score"])
                                            },
                                            candidat2:{
                                              nom: line["cas5-candidat2-nom"],
                                              parti: line["cas5-candidat2-parti"],
                                              score: Number(line["cas5-candidat2-score"])
                                            },
                                            candidat3:{
                                              nom: line["cas5-candidat3-nom"],
                                              parti: line["cas5-candidat3-parti"],
                                              score: Number(line["cas5-candidat3-score"])
                                            },
                                            candidat4:{
                                              nom: line["cas5-candidat4-nom"],
                                              parti: line["cas5-candidat4-parti"],
                                              score: Number(line["cas5-candidat4-score"])
                                            },
                                            candidat5:{
                                              nom: line["cas3-candidat5-nom"],
                                              parti: line["cas3-candidat5-parti"],
                                              score: Number(line["cas3-candidat5-score"])
                                            }
                                        }
                                    }  
                              }
                      });
            });
           

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
                    minZoom: 5,
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
                 

          this.map = new google.maps.Map(document.getElementById("carte"),mapOptions);
          
          $.each(donnees, function(index,data) {
               googleMap.addMarker(data,donnees);
          })

          tailleIframe();

          
         
    },

    addMarker: function(donnees,toutesdonnees) {


                    
                   var marker = new google.maps.Marker({
                     position: new google.maps.LatLng(donnees.latitude,donnees.longitude),
                     draggable: false,
                     raiseOnDrag: false,
                     map: this.map,
                     icon: new google.maps.MarkerImage('img/autres.png')
                   });
                    
                    if(donnees.tour == "1") {
                      var tour = "premier tour"
                    }
                    else {
                      var tour = "second tour"
                    }
                    var notule = "<p class=\"tt3_capital\">"+donnees.ville+"</p><div class=\"date\"><h3>Dernier sondage : "+donnees.date+"</h3><h3>portant sur le "+tour+"</h3></div>";
                    notule += "<p class=\"precisions\">";


                    if(donnees.ville == "Marseille" || donnees.ville == "Paris") {
                          notule += "<p class=\"tt4_capital secteur\">Sondage sur la ville entière :</p>";
                    };


                    afficherSondages(donnees.cas,donnees);
                    function afficherSondages(data,notulo) {
                      console.log(notulo)
                           if(notulo.notule) {
                              notule += "<a href=\""+notulo.lien+"\" target=\"_blank\">"+notulo.notule+"</a>";
                            }
                            else {
                              notule += notulo.notule
                            }
                            notule += "</p>";

                              $.each(data, function(key,value) {
                        
                          if(value.cas) {
                              notule += "<p class=\"tt5_capital\">&rsaquo; Cas n°"+value.id+" : "+value.cas+"</p><table>";
                 
                              var scoreMaximum = value.candidats.candidat1.score;


                              $.each(value.candidats, function(index,value2) {
                                    if(value2.nom) {
                                      if(value2.parti) 
                                      {
                                          if(value2.parti.substring(0,2) == "PS" || value2.parti.substring(0,3) == "PRG" || value2.parti.substring(0,13) == "Divers-gauche") {
                                            var couleurPolitique = "ps"
                                          }
                                          if(value2.parti.substring(0,2) == "FN") {
                                            var couleurPolitique = "fn";
                                          }
                                          if(value2.parti.substring(0,2) == "FG" || value2.parti.substring(0,3) == "NPA" || value2.parti.substring(0,22) == "Gauche anticapitaliste" || value2.parti.substring(0,15) == "Front de gauche") {
                                            var couleurPolitique = "fdg";
                                          }
                                          if(value2.parti.substring(0,3) == "UMP" || value2.parti.substring(0,13) == "Divers-droite") {
                                            var couleurPolitique = "droite"
                                          }
                                          if(value2.parti.substring(0,3) == "UDI" || value2.parti.substring(0,13) == "Divers-centre" || value2.parti.substring(0,5) == "Modem") {
                                            var couleurPolitique = "udi"
                                          }
                                          if(value2.parti.substring(0,4) == "EELV") {
                                            var couleurPolitique = "eelv"
                                          }
                                      }
                                        

                                      notule += "<tr><td class=\"nom\"><span>"+value2.nom+"</span>";
                                      if(value2.parti) {
                                        notule += "<br>("+value2.parti+")";
                                      }
                                      notule += "</td><td><div class=\"pourcentage "+couleurPolitique+"\" style=\"width:"+(value2.score*124)/(scoreMaximum+3)+"px\"></div></td><td class=\"score\">"+value2.score+"&nbsp;%</td></tr>";
                                    }
                              });
                              notule += "</table>";
                          }
                    });
                    }
       

                villesASecteurs("Marseille");
                villesASecteurs("Paris");

                function villesASecteurs(ville) {

                  if(donnees.ville == ville) {

                             $.each(toutesdonnees, function(index,value3) {
                                  if(value3.ville.substring(0,ville.length) == ville && value3.ville !== ville) {
                                      notule += "<p class=\"tt4_capital secteur\">"+ value3.ville.substring(ville.length+1) +" :</p>";
                              
                                      afficherSondages(value3.cas,value3)
                                  }
                             })



                          
                    };
                }


                    var infowindow = new google.maps.InfoWindow({
                        content: "<div class=\"infofirefox\"><p align=\"center\" class=\"tt4_capital\">"+donnees.ville+"</p></div>",
                        pixelOffset: new google.maps.Size(0, -18)
                    });

                    
                    google.maps.event.addListener(marker, 'mouseover', function() {
                      infowindow.open(this.map,marker);
                    });
                     google.maps.event.addListener(marker, 'mouseout', function() {
                      infowindow.close(this.map,marker);
                    });


                    this.markers[donnees.id] = marker;

                    google.maps.event.addListener(marker, 'click', function() {
                        $("#notule").html(notule);
                    });

                    if(donnees["couleuractuelle"]) {
                   
                      // couleur = donneesStructurees["couleuractuelle"].toLowercase();
                      marker.setIcon(new google.maps.MarkerImage('img/'+donnees["couleuractuelle"]+'.png',new google.maps.Size(16,16),new google.maps.Point(0,0)));
                    }
          

                    return marker;
      },


  }








function tailleIframe()
{
  if (top.location != self.document.location)
    {
      $(window.parent.document).find('.embed').children('iframe').get(0).height=$('body').height()+40;
    }
}