<template >
    <section>
        <div>
        <add-meal></add-meal>
        </div>
    </section>
</template>
<script>
    import AddMeal from '../addmeal/addmeal'
    export default{
        data(){
            return {
            }
        },
        components:{
            AddMeal
        }
    }
</script>
<style scoped lang="scss">
    
 .bkg-pic{
	background-image: url('../../assets/backgrounds/4.jpg');
    background-size: 100% 100%;     
	background-repeat: repeat-x;    
	/*background-repeat: space;*/
    animation: animatedBackground 40s linear infinite;
    
 }
</style>


