// Ionic Starter App
var db = null;
var usuario = '';

angular.module('starter', ['ionic', 'ngCordova'])

.run(function($ionicPlatform, $cordovaSQLite, $state, $cordovaNetwork) {
  $ionicPlatform.ready(function() {
    
    if(window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
    }
    
    if(window.StatusBar) {
      StatusBar.styleDefault();
    }
    
    db = $cordovaSQLite.openDB("my.db");
    $cordovaSQLite.execute(db, 
              "CREATE TABLE IF NOT EXISTS aluno (matricula integer primary key, nome text, cpf text)");
    $cordovaSQLite.execute(db, 
              "CREATE TABLE IF NOT EXISTS mensagem (id integer primary key, autor text, conteudo text, tipo text, date Date)");
    
    formPage();
    buscarUsuario();

  });

})

.config(function($stateProvider, $httpProvider, $urlRouterProvider) {

      $stateProvider
      .state('home', {
        url: '/home',
        templateUrl: 'tpl/form.html'
      })

      .state('blank', {
        url: '/blank',
        templateUrl: 'tpl/blank.html'
      })

      
      .state('form', {
        url: '/form',
        templateUrl: 'tpl/form.html'
      })      

      .state('chat', {
        url: '/chat',
        templateUrl: 'tpl/chat.html'
      })
  
      $urlRouterProvider.otherwise('/blank')

      $httpProvider.defaults.useXDomain = true;
      $httpProvider.defaults.withCredentials = true;
      delete $httpProvider.defaults.headers.common['X-Requested-With'];

})

.controller('controller-chat', function($scope, $cordovaSQLite, $http, $state, modelChat, $cordovaCamera, $cordovaLocalNotification, $cordovaNetwork) {
  
  function onDeviceReady(){
    document.addEventListener('pause', onPause, false);
    document.addEventListener('resume', onResume, false);

    window.plugin.backgroundMode.disable();
  }
  
  function onResume(){
    window.plugin.backgroundMode.disable();
  }
  
  function onPause(){
      window.plugin.backgroundMode.enable();
      
       setInterval(function(){

        var url = "http://192.168.43.218:8080/appMsgServer/MainServlet";
        var msgLocais;

        modelChat.listMensagensLocais(function(al){
          msgLocais = al;
        })
        
        $http.get(url).then(function(response){
          $scope.mensagens = response.data;
          
          if($scope.mensagens.length <= 20 || msgLocais.length == 0){
            if(msgLocais.length == 0 || msgLocais[msgLocais.length - 1].id < $scope.mensagens[$scope.mensagens.length - 1].id){
              notificação();
              modelChat.removerMensagemLocal();
              for(var i = $scope.mensagens.length; i >= 1; i--){
                modelChat.insertMensagemLocal($scope.mensagens[$scope.mensagens.length - i]);
              }
            }
          }else
              if($scope.mensagens.length > 20){
                if(msgLocais[19].id < $scope.mensagens[$scope.mensagens.length - 1].id){
                  notificação();
                  modelChat.removerMensagemLocal();
                  for(var i = 20; i >= 1; i--){
                      modelChat.insertMensagemLocal($scope.mensagens[$scope.mensagens.length-i]);
                    }
                  }
              }
        });
        
      }, 2000);
  }

  document.addEventListener('deviceready', onDeviceReady, false);

  notificação = function(){
    var alarme = new Date();
    alarme.setSeconds(alarme.getSeconds() + 2);

    $cordovaLocalNotification.add({
        id: "000192",
        date: alarme,
        message: "Nova Mensagem",
        title: "Notificação"
    }).then(function(){
        //alert("Ok");
    })
  };

  //$scope.mensagens = []; 

  setInterval(function(){
      
      if($cordovaNetwork.isOnline()){
        
        var url = "http://192.168.43.218:8080/appMsgServer/MainServlet"; 
        var msgLocais;

        modelChat.listMensagensLocais(function(al){
          msgLocais = al;
        })

        $http.get(url).then(function(response){
          $scope.mensagens = response.data;
          
          if($scope.mensagens.length <= 20 || msgLocais.length == 0){
            if(msgLocais.length == 0 || msgLocais[msgLocais.length - 1].id < $scope.mensagens[$scope.mensagens.length - 1].id){
              //notificação();
              modelChat.removerMensagemLocal();
              for(var i = $scope.mensagens.length; i >= 1; i--){
                modelChat.insertMensagemLocal($scope.mensagens[$scope.mensagens.length - i]);
              }
            }
          }else
              if($scope.mensagens.length > 20){
                if(msgLocais[19].id < $scope.mensagens[$scope.mensagens.length - 1].id){
                  //notificação();
                  modelChat.removerMensagemLocal();
                  for(var i = 20; i >= 1; i--){
                      modelChat.insertMensagemLocal($scope.mensagens[$scope.mensagens.length-i]);
                    }
                  }
              }
        });
      }else{
        modelChat.listMensagensLocais(function(al){
          $scope.mensagens = al;
        })
      }

  },2000);

  $scope.enviarMensagemTexto = function(){
    var url = "http://192.168.43.218:8080/appMsgServer/MainServlet"; 
    $scope.mensagem.autor = usuario.nome;
    $scope.mensagem.tipo = "Texto";
    $scope.mensagem.date = new Date();
    
    $http.post(url, $scope.mensagem).success(function(status) {
      delete $scope.mensagem;    
      alert("Enviado com sucesso");
    });
  };

  $scope.enviarMsgFoto = function(){
      var option = {
        quality: 50,
        destinationType: Camera.DestinationType.DATA_URL,
        sourceType: Camera.PictureSourceType.CAMERA,
        encodingType: Camera.EncodingType.JPEG,
        targetWidth: 120,
        targetHeight: 160
      };

      $cordovaCamera.getPicture(option).then(function(imageDate){
         
        var autor = usuario.nome;
        var tipo = "Foto";
        var conteudo = imageDate;
        
        var json = {"autor": autor, "tipo":tipo, "conteudo": conteudo};
        var url = "http://192.168.43.218:8080/appMsgServer/MainServlet"; 
        
        $http.post(url, json).success(function(status) {
          alert("Enviado com sucesso");
        });
          
      }, function(err){
          alert("Erro" + err);
      });
  };

  $scope.insert = function() {
    modelChat.insertAluno($scope.aluno);
    delete $scope.aluno;

    buscarUsuario = function(){
      modelChat.buscarUsuario(function(al){
          usuario = al;
      })
    }

  };

  formPage = function(){
    //$state.go("home");
    modelChat.formPageRedirect();
  };

  $scope.buscarUsuarioOnline = function(){
    modelChat.buscarUsuario(function(al){
        $scope.usuarioOnline = al;
    })
  }

  buscarUsuario = function(){
    modelChat.buscarUsuario(function(al){
        usuario = al;
    })
  }

  listarMensagensBDLocal = function(){
    modelChat.listMensagensLocais(function(al){
        $scope.mensagens = al;
    })
  }
})

.factory('modelChat', function($state, $cordovaSQLite){
  return {
      insertAluno: function(aluno){
        var query = "INSERT INTO aluno (matricula, nome, cpf) VALUES (?,?,?)";
    
        $cordovaSQLite.execute(db, query, [aluno.matricula, aluno.nome, 
            aluno.cpf]).then(function(res) {

            alert("Cadastro salvo com sucesso");
            $state.go("chat");
            
        }, function (err) {
            $state.go("home");r
            alert("Erro ao inserir dados");
        });
      
      },

      buscarUsuario: function(callback){
        var query = "SELECT matricula, nome, cpf FROM aluno";
        $cordovaSQLite.execute(db, query, []).then(function(res) {
          if(res.rows.length > 0) {
            callback(res.rows.item(0));
          } 
        }, function (err) {
              alert("Erro ao realizar consulta");
        });
      },

      formPageRedirect: function(){
        var query = "SELECT matricula, nome, cpf FROM aluno";
        $cordovaSQLite.execute(db, query, []).then(function(res) {
          if(res.rows.length > 0) {
            $state.go("chat");
          } else {
            alert("Nenhum usuario cadastrado!");
            $state.go("form");
          }
        }, function (err) {
              alert("Erro ao realizar consulta");
          });
      },

      insertMensagemLocal: function(mensagem){
        var query = "INSERT INTO mensagem (id, autor, conteudo, date, tipo) VALUES (?,?,?,?,?)";
    
        $cordovaSQLite.execute(db, query, [mensagem.id, mensagem.autor, mensagem.conteudo, 
          mensagem.date, mensagem.tipo]).then(function(res) {
          //alert("Mensagem Local");

        }, function (err) {
           alert("Erro ao enviar mensagem");
        });
      },

      listMensagensLocais: function(callback){
        var query = "SELECT id, autor, conteudo, date, tipo FROM mensagem";
        $cordovaSQLite.execute(db, query, []).then(function(res) {
            if(res.rows.length >= 0) {
                result = []
                for (var i = 0; i < res.rows.length; i++){
                  result.push(res.rows.item(i))
                }
                callback(result)
            } else {
                alert("Nenhum Resultado Encontrado");
            }
        }, function (err) {
              alert(err);
        });
      },

      removerMensagemLocal: function(){
          var query = "DELETE FROM mensagem";
          $cordovaSQLite.execute(db, query, []).then(function(res) {

          }, function (err) {
            $state.go("home");r
            alert("Erro ao inserir dados");
          });
      }
  };
})